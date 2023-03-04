import { Tool } from "./tools/base/Tool";

export interface CompletionItem {
	text: string;
	type: CompletionType;
	completed: boolean;
	tool?: Tool;
}

export enum CompletionType {
	DEFAULT,
	TOOL,
	ERROR,
}

export function getPayload(completionItem: CompletionItem) {
	// return completionItem.text;
	if (completionItem.type === CompletionType.DEFAULT) {
		// const result = completionItem.text;
		const result = completionItem.text.replace("】】】", "");
		console.log(result);
		return result;
		// return completionItem.text.replace("】】】", "");
	} else if (completionItem.type === CompletionType.TOOL) {
		const result = sanitizeText(
			completionItem.text,
			`${completionItem.tool?.getName()}`
		);
		console.log(result);
		return result;
	}
	const result = completionItem.text.replace("】】】", "");
	console.log(result);
	return result;
}

export function getToolInput(completionItem: CompletionItem) {
	let payload = getPayload(completionItem);
	console.log(payload);
	return payload.split("→→→")[0];
}

export function getToolOutput(completionItem: CompletionItem) {
	let payload = getPayload(completionItem);
	let split = payload.split("→→→");
	console.log(split);
	const result =  split[split.length - 1];
	console.log(result);
	return result;
}

function sanitizeText(text: string, toolKey: string) {
	console.log({text, toolKey});
	// return text;
	return text
		.replace("【【【", "")
		.replace(`${toolKey}「「「`, "")
		.replace("」」」", "")
		.replaceAll(/】】】/g, "")
		.trim();
}
