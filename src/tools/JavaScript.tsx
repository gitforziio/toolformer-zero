import { Tool } from "./base/Tool";
import JavascriptRoundedIcon from '@mui/icons-material/JavascriptRounded';
import { ReactElement } from "react";

export class JavaScript extends Tool {
	getName(): string {
		return "JavaScript";
	}

	getUniqueHumanName(): string {
		return "JavaScript";
	}

	getHumanDescription(): string {
		return "执行 JavaScript 代码，返回执行结果";
	}

	getDefinition(): string {
		// return "This allows you to evaluate mathematical expressions using the math.js library.";
		return "该工具允许你使用 JavaScript 代码来完成各项可能的任务。";
	}

	getExamplePrompt(): string {
		return "将字符串“我爱北京天安门”倒序排列，输出的新字符串是什么？";
	}

	getExampleCompletion(): string {
		return `“我爱北京天安门”倒序排列的结果是【【【JavaScript「「「Array.from("我爱北京天安门").reverse().join("")」」」 →→→ "门安天京北爱我"】】】 “门安天京北爱我”。`;
	}

	// getExampleMultiPrompt(): string {
	// 	return "Has Avatar the way of water been released yet?";
	// }

	// getExampleMultiCompletion(): string {
	// 	return "[SEARCH(Avatar the way of water release date) -> 22.11.2022] Avatar: The way of water was released on the 22nd of november 2022. Today is [NOW() -> DATE_TODAY] the 13th of February 2023. Therefore, [MATH(2023 > 2022) -> true] it was released last year.";
	// }

	// getExampleMultiDependencies(): Array<string> {
	// 	return ["SEARCH", "NOW"];
	// }

	getIcon(): ReactElement {
		return <JavascriptRoundedIcon />;
	}

	async useTool(query: string) {
		//Use mathjs to evaluate query
		try {
			let result = eval(query);
			// let resultString = result.toString();
			let resultString = JSON.stringify(result);
			this.reportResult(resultString);
		} catch (error) {
			console.log("JS error");
			console.log(query);
			console.log(error);
			this.reportError(error);
		}
	}
}
