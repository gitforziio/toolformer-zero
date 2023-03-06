import { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
	Alert,
	AlertTitle,
	Grid,
	IconButton,
	// Link,
	ThemeProvider,
} from "@mui/material";
import { theme } from "./Constants";
import { CompletionItem, CompletionType, getToolInput } from "./CompletionItem";
import { CompletionElement } from "./CompletionElement";
import { PromptInput } from "./PromptInput";
import {
	alertStyle,
	// githubLinkStyle,
	rootGridStyle,
	toolButtonStyle,
} from "./MuiStyles";
import { Tool } from "./tools/base/Tool";
import { ToolSetup } from "./ToolSetup";
import { Setup } from "./Setup";
import ConstructionIcon from "@mui/icons-material/Construction";
import { getActiveToolNames, getToolParam, getToolParams } from "./Cookies";
import { allTools } from "./tools/base/AllTools";
import { chatCompletion } from "./api";

function App() {
	const [setupCompleted, setSetupCompleted] = useState<boolean | undefined>(
		undefined
	);
	const [toolSetupActive, setToolSetupActive] = useState(false);
	const [requestActive, setRequestActive] = useState(false);
	const [completion, setCompletion] = useState<Array<CompletionItem>>([]);
	const [toast, setToast] = useState("");

	var rawCompletion = useRef("");
	var newCompletion = useRef("");
	var curCompletion = useRef<Array<CompletionItem>>([]);
	var curActiveTools = useRef<Array<Tool>>([]);

	useEffect(() => {
		if (!setupCompleted) {
			getCookies();
		}
	}, []);

	function completeSetup(openaiApiKey: string, wasUserInput: boolean) {
		initializeActiveTools();

		if (openaiApiKey?.length != 51) return false;
		setSetupCompleted(true);
		return true;
	}

	function showErrorToast(msg: string, wasUserInput: boolean = true) {
		if (!wasUserInput) return false;
		setToast(msg);
		new Promise((f) =>
			setTimeout(() => {
				setToast("");
			}, 5000)
		);
		return false;
	}

	function getCookies() {
		completeSetup(getToolParam("Global", "openaiApiKey"), false);
	}

	function applyToolParams(tool: Tool, params: { [key: string]: string }) {
		if (!tool) return;
		curActiveTools.current.forEach((activeTool) => {
			if (activeTool.getUniqueHumanName() == tool.getUniqueHumanName())
				return activeTool.setParams(params);
		});
	}

	function updateActiveTools(tool: Tool, isActive: boolean) {
		let newActiveTools = [...curActiveTools.current];
		let index = newActiveTools.findIndex((activeTool) => {
			return activeTool.getUniqueHumanName() == tool.getUniqueHumanName();
		});
		if (!isActive) {
			if (index != -1) {
				newActiveTools.splice(index, 1);
			}
		} else {
			if (index == -1) {
				tool.setParams(getToolParams()?.[tool.getUniqueHumanName()] ?? {});
				newActiveTools.push(tool);
			}
		}
		curActiveTools.current = newActiveTools;
	}

	function initializeActiveTools(tools?: Array<Tool>) {
		if (curActiveTools.current.length != 0) return;
		let newActiveTools = tools ? tools : [...curActiveTools.current];

		const activeToolNames = getActiveToolNames();
		const toolParams = getToolParams();
		activeToolNames.forEach((toolName) => {
			allTools.forEach((tool) => {
				const toolInstance = new tool(setToolResult, setToolError);
				if (toolInstance.getUniqueHumanName() == toolName) {
					toolInstance.setParams(toolParams?.[toolName] ?? {});
					newActiveTools.push(toolInstance);
				}
			});
		});
		curActiveTools.current = newActiveTools;
		setSetupCompleted(false);
		return newActiveTools;
	}

	async function sendPrompt(prompt: string) {
		//Injects user prompt into template and requests completion
		if (requestActive) return;
		//Reset all completion data
		curCompletion.current = [];
		rawCompletion.current = "";
		newCompletion.current = "";
		setRequestActive(true);
		//Inject prompt into template and get completion
		getCompletion(prompt);
	}


	async function getCompletion(prompt: string) {
		//Stream completion from OpenAI);
// <<<<<<< new_model_qian
		// !TODO: 模型选择，目前有chatCompletion和textCompletion两种可选
		console.log("\n\n[getCompletion]\n\n");
		const es = await chatCompletion(prompt, curActiveTools.current);
// =======
// 		var es = await fetch("https://api.openai.com/v1/completions", {
// 			headers: {
// 				"Content-Type": "application/json",
// 				Authorization: "Bearer " + getToolParam("Global", "openaiApiKey"),
// 			},
// 			method: "POST",
// 			body: JSON.stringify({
// 				// model: "text-curie-001",
// 				model: "text-davinci-003",
// 				prompt: final_prompt,
// 				temperature: 0.7,
// 				max_tokens: 500,
// 				stream: true,
// 			}),
// 		});
// >>>>>>> master
		const reader = es.body?.pipeThrough(new TextDecoderStream()).getReader();
		if (!reader) return;

		//Update raw completion to include prompt
		//(important to continue streams after tool evaluation)
		rawCompletion.current = prompt;

		//Stream completion either until a tool was used or the completion has ended
		let toolUsed = false;
		while (!toolUsed) {
			const res = await reader?.read();
			toolUsed = await readCompletionStream(res);
			if (res?.done) break;
		}

		//Allow next request, update UI
		setRequestActive(toolUsed);
	}

	async function readCompletionStream(res: ReadableStreamReadResult<string>) {
		//Parse OpenAI response
		//Multiple JSON responses may be received in one execution of reader.read()
		//We therefore sanitize the raw response and then split on newlines
		const raw_json = res?.value?.replaceAll("data:", "").trim() ?? "";
		const split_json = raw_json.split("\n");
		let toolUsed = false;
		//Attempt to parse each received JSON object
		split_json.every((json_string) => {
			json_string = json_string.trim();
			if (json_string.length > 0) {
				try {
					const json = JSON.parse(json_string);
					// console.log(json);
					//Get completion token(s) received
					let token: string = json.choices[0].text ?? json.choices[0].delta?.content ?? '';
					//Trim start of completion to avoid ugly whitespace
					if (newCompletion.current.length == 0) token = token.trimStart();
					//Amend completion data
					rawCompletion.current += token;
					newCompletion.current += token;
					//Parse current completion
					toolUsed = parseCompletion();
				} catch (ex) {
					//If exception is not caused by OpenAI [DONE] payload, throw error
					if (json_string.indexOf("[DONE]") == -1) {
						addError();
						console.error(ex);
					}
				}
			}
			//Break out of every() if tool was used
			return !toolUsed;
		});
		return toolUsed;
	}

	function parseCompletion() {
		let toolUsed = false;
		//Match for tools
		let matches = newCompletion.current.match(/(【【【)\S.+?(→→→)/g);
		console.log(newCompletion);
		if (matches) {
			//If matches exist, strip out non-tool string and complete existing item if exists
			let preToolString = newCompletion.current.replace(matches[0], "");
			amendDefaultItem(preToolString, true);
			//Add completion item for found tool
			let toolItem = addCompletionItem(matches[0], CompletionType.TOOL);
			//Reset newCompletion string once tool has been added
			newCompletion.current = "";
			//Evaluate and cancel stream
			evaluateTool(toolItem);
			toolUsed = true;
		} else {
			//If no matches exist, we are just streaming a normal completion
			//We make sure to only show characters up to a potential [
			let split = newCompletion.current.split("【【【");
			amendDefaultItem(split[0], false);
		}
		//For each completed parse, we update the state to trigger a re-render
		setCompletion([...curCompletion.current]);
		return toolUsed;
	}

	function addCompletionItem(
		text: string,
		type: CompletionType,
		completed = false,
		tool?: Tool
	) {
		//Add a completion item to the current stack
		let toolItem: CompletionItem = {
			text: text,
			type: type,
			completed: completed,
			tool: getTool(text),
		};
		curCompletion.current.push(toolItem);
		return toolItem;
	}

	function amendDefaultItem(text: string, complete: boolean) {
		//Amend the last default completion item if it exists, otherwise add to stack
		let lastCompletion =
			curCompletion.current[curCompletion.current.length - 1];
		if (lastCompletion && lastCompletion.type == CompletionType.DEFAULT) {
			curCompletion.current[curCompletion.current.length - 1].text = text;
			curCompletion.current[curCompletion.current.length - 1].completed =
				complete;
		} else {
			addCompletionItem(text, CompletionType.DEFAULT, true);
		}
	}

	function addError() {
		addCompletionItem(" An error occurred. :( ", CompletionType.ERROR, true);
		setCompletion(curCompletion.current);
		setRequestActive(false);
	}

	async function evaluateTool(completionItem: CompletionItem) {
		//Use tool specified in completion item if available
		const tool = completionItem.tool;
		if (tool) {
			tool.useTool(getToolInput(completionItem));
		} else {
			addError();
		}
	}

	function getTool(text: string) {
		//Get appropriate active tool for completion item if available
		return curActiveTools.current.find((tool) => {
			if (text.includes(tool.getName() + "「「「")) {
				return tool;
			}
		});
	}

	function setToolResult(resultString: string) {
		//Add tool result to last completion item, then continue completion stream
		// resultString += "]";
		let lastCompletion =
			curCompletion.current[curCompletion.current.length - 1];
		lastCompletion.text += resultString;
		lastCompletion.completed = true;
		getCompletion(rawCompletion.current + resultString);
	}

	function setToolError(error: any) {
		addError();
	}

	return (
		<ThemeProvider theme={theme}>
			<Grid
				container
				spacing={0}
				direction={setupCompleted ? "column" : "row"}
				alignItems="center"
				justifyContent="center"
				sx={rootGridStyle}
			>
				<img src={logo} width={toolSetupActive ? "0px" : "600px"}></img>
				{toolSetupActive ? (
					<ToolSetup
						tools={curActiveTools.current}
						showErrorToast={showErrorToast}
						setActive={setToolSetupActive}
						updateActiveTools={updateActiveTools}
						setToolResult={setToolResult}
						setToolError={setToolError}
						applyToolParams={applyToolParams}
					></ToolSetup>
				) : setupCompleted ? (
					<div>
						<IconButton
							onClick={() => setToolSetupActive(true)}
							sx={toolButtonStyle}
						>
							<ConstructionIcon></ConstructionIcon>
						</IconButton>
						<PromptInput
							sendPrompt={sendPrompt}
							completionReceived={completion.length > 0}
							requestActive={requestActive}
						></PromptInput>
					</div>
				) : (
					<Setup
						completeSetup={completeSetup}
						tools={curActiveTools.current}
						showErrorToast={showErrorToast}
						applyToolParams={applyToolParams}
					></Setup>
				)}
				{setupCompleted && !toolSetupActive && (
					<div className="Completion-Parent">
						{completion.map((item, index) => (
							<CompletionElement completion={item} key={`cc-${index}`}></CompletionElement>
						))}
					</div>
				)}

				{toast.length != 0 && (
					<Alert severity="error" sx={alertStyle}>
						<AlertTitle>Error</AlertTitle>
						{toast}
					</Alert>
				)}
				{/* <Link
					underline={"none"}
					color={"#00000077"}
					href={"https://github.com/minosvasilias"}
					variant={"caption"}
					target={"_blank"}
					sx={githubLinkStyle}
				>
					Created by Markus Sobkowski
				</Link> */}
			</Grid>
		</ThemeProvider>
	);
}

export default App;
