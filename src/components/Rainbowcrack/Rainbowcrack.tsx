import { Button, LoadingOverlay, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { UserGuide } from "../UserGuide/UserGuide";
import React from "react";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";

const title = "Rainbowcrack";
const description_userguide =
    "RainbowCrack is a computer program which generates rainbow tables to be used in password cracking . " +
    "Simply enter or paste the hash code you want to crack and press crack. " +
    "You will see your rainbow table after some time and you could use that to crack your password hashes. \n";
"How to use RainbowCrack:\n\n" +
    "Step 1: Provide a valid hash or hashes to be cracked.\n" +
    "       E.g. Provide the MD5 hash: 5f4dcc3b5aa765d61d8327deb882cf99\n\n" +
    "Step 2: Choose the appropriate rainbow table set for the hash algorithm used.\n" +
    "       E.g. Select the MD5 rainbow table set.\n\n" +
    "Step 3: Initiate the cracking process by executing RainbowCrack.\n\n" +
    "Step 4: Review the Output section to access the cracked passwords upon completion of the operation.";

interface FormValues {
    hashcode: string;
}

export function rcrack() {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [pid, setPid] = useState("");
    const [allowSave, setAllowSave] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    let form = useForm({
        initialValues: {
            hashcode: "",
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);

    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);

            // Allow Saving as the output is finalised
            setAllowSave(true);
            setHasSaved(false);
        },
        [handleProcessData]
    );

    // Actions taken after saving the output
    const handleSaveComplete = () => {
        // Indicating that the file has saved which is passed
        // back into SaveOutputToTextFile to inform the user
        setHasSaved(true);
        setAllowSave(false);
    };

    const onSubmit = async (values: FormValues) => {
        // Disallow saving until the tool's execution is complete
        setAllowSave(false);

        // Start the Loading Overlay
        setLoading(true);

        const args = ["."];
        args.push("-h", values.hashcode);

        //This is the old version for runCommand
        //const output = await CommandHelper.runCommand("rcrack", args);
        //setOutput(output);
        //setLoading(false);

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "rcrack",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput("");
        setHasSaved(false);
        setAllowSave(false);
    }, [setOutput]);

    return (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
            {LoadingOverlayAndCancelButton(loading, pid)}
            <Stack>
                {UserGuide(title, description_userguide)}
                <TextInput label={"Enter the Hash code"} required {...form.getInputProps("hashcode")} />
                <Button type={"submit"}>Crack</Button>
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
}
export default rcrack;
