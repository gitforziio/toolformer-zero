import { createTheme } from "@mui/material";

// export const defaultTools: Array<string> = ["Google Search", "Math JS", "Now"];

export const defaultTools: Array<string> = ["JavaScript"];

// export const prompt_template = `You are an AI assistant with several tools available to you. The tools are the following:
// TOOL_DEFINITIONS
// DO NOT USE TOOLS WITHIN TOOLS! KEEP ALL TOOL CALLS SEPARATE FROM EACH OTHER!

// TOOL_EXAMPLES
// User: USER_INPUT
// Assistant:`;

export const prompt_template = `你是一名AI助理，并且配备了几种工具可以使用，你可以根据情况决定是否使用这些工具。这些工具分别是：
TOOL_DEFINITIONS
切记：不要嵌套着使用工具！让每个工具的指令都相互分离！

TOOL_EXAMPLES
用户：USER_INPUT
AI助理：`;

export const primaryColor = "#ff833b";

export const theme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: primaryColor,
		},
		secondary: { main: "#000000", contrastText: "#fff" },
	},
	typography: {
		button: {
			textTransform: "none",
		},
	},
});
