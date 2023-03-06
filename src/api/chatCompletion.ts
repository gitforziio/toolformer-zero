import { ChatCompletionRequestMessage } from "openai";
import { Tool } from "../tools/base/Tool";
import { getToolParam } from "../Cookies";

export async function chatCompletion(user_message: string, curActiveTools: Tool[]) {
  // chat模型（新）
  // 文档：https://platform.openai.com/docs/api-reference/chat/create
  const es = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToolParam("Global", "openaiApiKey"),
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: formatPrompt(user_message, curActiveTools),
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    }),
  });
  return es;
}

function generateChatMessage(
  user_message: string,
  toolDefinitions: string,
  toolExamples: ChatCompletionRequestMessage[]
): ChatCompletionRequestMessage[] {
  return [
    {
      role: "system",
      content: `你是一名AI助理，并且配备了几种工具可以使用，你可以根据情况决定是否使用这些工具。这些工具分别是：
      ${toolDefinitions}
      切记：不要嵌套着使用工具！让每个工具的指令都相互分离！`,
    },
    ...toolExamples,
    {
      role: "user",
      content: user_message,
    },
  ];
}

function formatPrompt(userPrompt: string, curActiveTools: Tool[]) {
  //Format prompt using all active tools and user prompt
  let toolDefinitions = "";
  const toolExamples: ChatCompletionRequestMessage[] = [];
  //For each tool, add their definitions and examples
  curActiveTools.forEach((tool: Tool) => {
    toolDefinitions += `${tool.getName()}: ${tool.getDefinition()}\n`;
    toolExamples.push({
      role: "user",
      content: tool.getExamplePrompt(),
    });
    toolExamples.push({
      role: "assistant",
      content: tool.getExampleCompletion(),
    });
    //If multi-examples are defined, check for satisfied dependencies before adding
    if (
      tool.getExampleMultiPrompt() &&
      exampleMultiDependenciesSatisfied(tool, curActiveTools)
    ) {
      toolExamples.push({
        role: "user",
        content: tool.getExampleMultiPrompt() || '',
      });
      toolExamples.push({
        role: "assistant",
        content: tool.getExampleMultiCompletion() || '',
      });
    }
  });
  return generateChatMessage(userPrompt, toolDefinitions, toolExamples);
}

function exampleMultiDependenciesSatisfied(tool: Tool, curActiveTools: Tool[]) {
  //Iterate through multi example dependencies, and check if corresponding tool
  //implementing tool name is active
  let allDependenciesSatisfied = true;
  tool.getExampleMultiDependencies().forEach((toolName: any) => {
    const satisfied =
      curActiveTools.findIndex((activeTool: Tool) => {
        return activeTool.getName() == toolName;
      }) != -1;
    allDependenciesSatisfied = satisfied ? allDependenciesSatisfied : false;
  });
  return allDependenciesSatisfied;
}
