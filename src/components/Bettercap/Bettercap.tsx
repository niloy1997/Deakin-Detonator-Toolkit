import { Button, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { RenderComponent } from "../UserGuide/UserGuide";

// Component Constants.
const title = "Bettercap"; // Title of the component.
const description = "Bettercap is a tool used to..."; // Description of the component.
const steps =
    "Step 1: Type in the name of your fake host.\n" +
    "Step 2: ...";
const sourceLink = ""; // Link to the source code (or Kali Tools).
const tutorial = ""; // Link to the official documentation/tutorial.
const dependencies = ["bettercap"]; // Contains the dependencies required by the component.

//Variables
interface FormValuesType { //Relevant form values to be added as bettercap options are added
    bettercapOptions: string; 
}

//Bettercap Options
const bettercapOptions = [ //More options to be added (version check could be kept?)
    "Version Check"
];

const Bettercap = () => {
    var [output, setOutput] = useState("");
    const [selectedBettercapOption, setSelectedBettercapOption] = useState("");
    const [allowSave, setAllowSave] = useState(false); // State variable to allow saving of output
    const [hasSaved, setHasSaved] = useState(false); // State variable to indicate if output has been saved
    const [loading, setLoading] = useState(false); // State variable to indicate loading state

    let form = useForm({ //Relevant form values to be added as bettercap options are added
        initialValues: {
            input1: "",
        },
    });

    const onSubmit = async (values: FormValuesType) => {
        // Set loading state to true and disallow output saving
        setLoading(true);
        setAllowSave(false);

        let args = [``];

        //Switch case
        switch (values.bettercapOptions) {
            case "Version Check": //This version check option is a baseline to test that bettercap functions
                args = [`-v`];

                try {
                    let output = await CommandHelper.runCommand("bettercap", args);
                    setOutput(output);
                } catch (e: any) {
                    setOutput(e);
                } finally{
                    // Set loading state to false and allow output saving
                    setLoading(false);
                    setAllowSave(true);
                }

                break;
        }
    };

     /**
     * Handles the completion of output saving by updating state variables.
     */
     const handleSaveComplete = () => {
        setHasSaved(true); // Set hasSaved state to true
        setAllowSave(false); // Disallow further output saving
    };

    /**
     * Clears the command output and resets state variables related to output saving.
     */
    const clearOutput = () => {
        setOutput(""); // Clear the command output
        setHasSaved(false); // Reset hasSaved state
        setAllowSave(false); // Disallow further output saving
    };

    //<ConsoleWrapper output={output} clearOutputCallback={clearOutput} /> prints the terminal on the tool
    return (
        <RenderComponent
            title={title}
            description={description}
            steps={steps}
            tutorial={tutorial}
            sourceLink={sourceLink}
        >
        <form onSubmit={form.onSubmit((values) => onSubmit({ ...values, bettercapOptions: selectedBettercapOption }))}>
            <Stack>
                
                <NativeSelect
                    value={selectedBettercapOption}
                    onChange={(e) => setSelectedBettercapOption(e.target.value)}
                    title={"Bettercap option"}
                    data={bettercapOptions}
                    required
                    placeholder={"Pick a Bettercap option"}
                    description={"Type of action to perform"}
                />
                <TextInput label={"Input 1"} {...form.getInputProps("input1")} />
                <Button type={"submit"}>start bettercap</Button>
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
        </RenderComponent>
    );
};

export default Bettercap;
