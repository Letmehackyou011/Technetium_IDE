// apps/electron-ui/src/hooks/useGhostSuggestions.ts
import { useEffect, useRef } from 'react';
import * as monacoEditor from 'monaco-editor';

type EditorRef = React.RefObject<monacoEditor.editor.IStandaloneCodeEditor | null>;

export default function useGhostSuggestions(editorRef: EditorRef, opts?: { debounceMs?: number }) {
  const debounceMs = opts?.debounceMs ?? 600;
  const timerRef = useRef<number | null>(null);
  const decorationRef = useRef<string[]>([]);
  const lastSuggestionRef = useRef<string>('');
  const currentRequestRef = useRef<string | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Tab accepts suggestion if present
    const tabCommand = editor.addCommand(monacoEditor.KeyCode.Tab, () => {
      const suggestion = lastSuggestionRef.current;
      if (suggestion && suggestion.length > 0) {
        const pos = editor.getPosition();
        if (!pos) return;
        editor.executeEdits('ai-suggest', [{
          range: new monacoEditor.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
          text: suggestion,
        }]);
        // clear decorations
        decorationRef.current = editor.deltaDecorations(decorationRef.current, []);
        lastSuggestionRef.current = '';
      } else {
        // fallback: default Tab behavior
        editor.trigger('keyboard', 'tab', {});
      }
    });

    // Esc cancels suggestion
    const escCommand = editor.addCommand(monacoEditor.KeyCode.Escape, () => {
      decorationRef.current = editor.deltaDecorations(decorationRef.current, []);
      lastSuggestionRef.current = '';
    });

    const disposable = editor.onDidChangeModelContent(() => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(async () => {
        try {
          const pos = editor.getPosition();
          if (!pos) return;
          // get context up to cursor
          const context = editor.getModel()?.getValueInRange(new monacoEditor.Range(1, 1, pos.lineNumber, pos.column)) || '';
          const shortCtx = context.slice(-1200); // last N chars
          // request suggestion (preload exposed)
          // @ts-ignore
          const reqId: string = await (window as any).technetium.requestSuggestion(shortCtx, { max_tokens: 256 });
          currentRequestRef.current = reqId;
          let chunks: string[] = [];

          const onChunk = (payload: any) => {
            if (payload.requestId !== reqId) return;
            chunks.push(payload.chunk || '');
            const suggestion = chunks.join('');
            lastSuggestionRef.current = suggestion;
            // render as decoration AFTER cursor
            const curPos = editor.getPosition();
            if (!curPos) return;
            // remove existing decorations then add new
            const dec = [{
              range: new monacoEditor.Range(curPos.lineNumber, curPos.column, curPos.lineNumber, curPos.column),
              options: {
                after: {
                  content: suggestion,
                  inlineClassName: 'ghost-suggestion'
                }
              }
            }];
            decorationRef.current = editor.deltaDecorations(decorationRef.current, dec);
          };

          const onDone = (payload: any) => {
            if (payload.requestId !== reqId) return;
            // final suggestion (we keep it visible until Tab/Esc)
          };

          // register listeners (preload should removeAllListeners before adding)
          // @ts-ignore
          (window as any).technetium.onSuggestionChunk(onChunk);
          // @ts-ignore
          (window as any).technetium.onSuggestionDone(onDone);

        } catch (e) {
          // ignore suggestion errors silently
        }
      }, debounceMs);
    });

    return () => {
      disposable.dispose();
      editor.removeCommand(tabCommand);
      editor.removeCommand(escCommand);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [editorRef, debounceMs]);
}