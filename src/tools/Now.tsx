import { Tool } from "./base/Tool";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { ReactElement } from "react";

export class Now extends Tool {
	getName(): string {
		return "NOW";
	}

	getUniqueHumanName(): string {
		return "Now";
	}

	getHumanDescription(): string {
		// return "Providing access to the current date and time. Takes no arguments, always returns the current time.";
		return "提供获取当前日期和时间的能力。无输入参数，总是返回当前时间。";
	}

	getDefinition(): string {
		// return "This returns the current date and time. You must not pass any arguments to this tool!";
		return "返回当前日期及时间。切记不可向此工具传递参数！";
	}

	getExamplePrompt(): string {
		// return "What day is it?";
		return "今天的日期是？";
	}

	getExampleCompletion(): string {
		// return "It is [NOW() -> 13/02/2023, 20:01:35] the 13th of February 2023.";
		return "今天是【【【NOW「「「」」」 →→→ 13/02/2023, 20:01:35】】】2023年2月13日。";
	}

	getIcon(): ReactElement {
		return <CalendarMonthIcon />;
	}

	async useTool(query: string) {
		//Get current date
		let dateString = new Date().toLocaleString();
		this.reportResult(dateString);
	}
}
