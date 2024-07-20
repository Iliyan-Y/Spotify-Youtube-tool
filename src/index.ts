import "dotenv/config";
import { env } from "process";

const testValue = env.TEST_VALUE;
export const main = (): string => testValue;

console.log(main());
