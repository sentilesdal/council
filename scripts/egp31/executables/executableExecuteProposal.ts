// # Script to update grants with new values
import { executeProposal } from "../executeProposal";

async function main() {
  await executeProposal();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("error");
    console.error(error);
    process.exit(1);
  });
