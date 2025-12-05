import React from "react";
import { createRoot } from "react-dom/client";
import AppUI from "./ui/AppUI";
import "./ui/styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(<AppUI />);