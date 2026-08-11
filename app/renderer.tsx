import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { createRoot } from "react-dom/client";
import "./i18n";
import { App } from "./App";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#55d6be" },
    secondary: { main: "#78a9ff" },
    background: { default: "#071019", paper: "#0f1c27" }
  },
  shape: { borderRadius: 14 },
  typography: { fontFamily: 'Inter, "Segoe UI", "Yu Gothic UI", sans-serif' },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid #203342" } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: "none", fontWeight: 700 } } }
  }
});

const root = document.getElementById("root");
if (!root) throw new Error("Missing React root");
createRoot(root).render(<ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider>);
