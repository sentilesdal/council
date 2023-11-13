import fs from "fs";
import { getProposalArgs } from "scripts/egp-tbd/createProposalUpdateGrants";

const { PRIVATE_KEY } = process.env;

//*************************************************//
// Returns the arguments needed to create an upgrade
// grants proposal.
//*************************************************//
export async function main() {
  if (!PRIVATE_KEY) {
    console.log("NO PRIVATE KEY, EXITING");
    return;
  }

  console.log("getting the proposal arguments");

  const proposalArgs = await getProposalArgs();

  console.log("proposalArgs", proposalArgs);
  const data = JSON.stringify(proposalArgs, null, 2);
  fs.writeFileSync("scripts/egp-tbd/proposalArgs.json", data);
}
