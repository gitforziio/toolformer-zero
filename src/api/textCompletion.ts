import { getToolParam } from "../Cookies";
import { prompt_template } from "../Constants";
import { Tool } from "../tools/base/Tool";

export async function textCompletion(prompt: string, curActiveTools: Tool[]) {
  //Stream completion from OpenAI);
  const es = await fetch("https://api.openai.com/v1/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToolParam("Global", "openaiApiKey"),
    },
    method: "POST",
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: formatPrompt(prompt, curActiveTools),
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    }),
  });
  return es;
}

function formatPrompt(userPrompt: string, curActiveTools: Tool[]) {
  //Format prompt using all active tools and user prompt
  let toolDefinitions = "";
  let toolExamples = "";
  //For each tool, add their definitions and examples
  curActiveTools.forEach((tool: Tool) => {
    toolDefinitions += `${tool.getName()}: ${tool.getDefinition()}\n`;
    // toolExamples += `User: ${tool.getExamplePrompt()}\nAssistant:${tool.getExampleCompletion()}\n`;
    toolExamples += `用户：${tool.getExamplePrompt()}\nAI助理：${tool.getExampleCompletion()}\n`;
    //If multi-examples are defined, check for satisfied dependencies before adding
    if (
      tool.getExampleMultiPrompt() &&
      exampleMultiDependenciesSatisfied(tool, curActiveTools)
    ) {
      // toolExamples += `User: ${tool.getExampleMultiPrompt()}\nAssistant:${tool.getExampleMultiCompletion()}\n`;
      toolExamples += `用户：${tool.getExampleMultiPrompt()}\nAI助理：${tool.getExampleMultiCompletion()}\n`;
    }
  });
  //Format template
  const final_prompt = prompt_template
    .replace("TOOL_DEFINITIONS", toolDefinitions)
    .replace("TOOL_EXAMPLES", toolExamples)
    .replace("DATE_TODAY", new Date().toDateString())
    .replace("USER_INPUT", userPrompt);
  return final_prompt;
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