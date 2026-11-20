import { main } from "./flux";

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
