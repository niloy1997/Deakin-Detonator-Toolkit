import { useState, useCallback, useEffect } from "react";
import { Button, Stack, TextInput, Switch } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { UserGuide } from "../UserGuide/UserGuide";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";
import { checkAllCommandsAvailability } from "../../utils/CommandAvailability";
import InstallationModal from "../InstallationModal/InstallationModal";

// Component Constants
const title = "Bully";

// Contains the description of the component.
const description_userguide =
    "Bully is a tool for brute-forcing WPS PIN authentication.\n" +
    "To use the Bully tool for WPS attacks, follow these steps:\n" +
    "- Enter the access point (AP) interface: Specify the interface name (e.g., wlan0) of the target Wi-Fi network you want to attack.\n" +
    "- Provide the password list: Input the path to the file containing the list of passwords to be tried during the brute-force attack.\n" +
    "- Optionally, provide the MAC address (BSSID) or Extended SSID (ESSID) of the target access point.\n" +
    "- Initiate the brute-force attack: Click the 'Start Bully Attack' button to begin the attack using the provided options.\n" +
    "- Review the output: After the attack is complete, review the output to identify the cracked WPS PIN, if successful.\n";

/**
 * Represents the form values for the Bully component.
 */
interface FormValuesType {
    interface: string;
    passwordList: string;
    bssid: string;
    essid: string;
}

const Bully = () => {
    // Component State Variables.
    const [loading, setLoading] = useState(false); // State variable to indicate loading state.
    const [output, setOutput] = useState(""); // State variable to store the output of the command execution.
    const [pid, setPid] = useState(""); // State variable to store the process ID of the command execution.
    const [allowSave, setAllowSave] = useState(false); // State variable to allow saving the output to a file.
    const [hasSaved, setHasSaved] = useState(false); // State variable to indicate if the output has been saved.
    const [isCommandAvailable, setIsCommandAvailable] = useState(false); // State variable to check if the command is available.
    const [opened, setOpened] = useState(!isCommandAvailable); // State variable to check if the installation modal is open.
    const [loadingModal, setLoadingModal] = useState(true); // State variable to indicate loading state for the installation modal.
    const [advancedMode, setAdvancedMode] = useState(false); // State variable to store the selected mode.

    // Component Constants.
    const dependencies = ["bully"]; // Dependencies required for the Bully tool.

    useEffect(() => {
        // Check the availability of all commands in the dependencies array.
        checkAllCommandsAvailability(dependencies)
            .then((isAvailable) => {
                // Set the state variable to indicate if the command is available.
                setIsCommandAvailable(isAvailable);
                // Set the state variable to indicate if the installation modal should be open.
                setOpened(!isAvailable);
                // Set the loading state of the installation modal to false after the check is done.
                setLoadingModal(false);
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                // Set the loading state of the installation modal to false in case of error.
                setLoadingModal(false);
            });
    }, []);

    // Form Hook to handle form input.
    const form = useForm<FormValuesType>({
        initialValues: {
            interface: "",
            passwordList: "",
            bssid: "",
            essid: "",
        },
    });

    /**
     * handleProcessData: Callback to handle and append new data from the child process to the output.
     * It updates the state by appending the new data received to the existing output.
     * @param {string} data - The data received from the child process.
     */
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Append new data to the previous output.
    }, []);

    /**
     * handleProcessTermination: Callback to handle the termination of the child process.
     * Once the process termination is handled, it clears the process PID reference and
     * deactivates the loading overlay.
     * @param {object} param - An object containing information about the process termination.
     * @param {number} param.code - The exit code of the terminated process.
     * @param {number} param.signal - The signal code indicating how the process was terminated.
     */
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            // If the process was terminated successfully, display a success message.
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
                // If the process was terminated due to a signal, display the signal code.
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
                // If the process was terminated with an error, display the exit code and signal code.
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }

            // Clear the child process pid reference. There is no longer a valid process running.
            setPid("");

            // Cancel the loading overlay. The process has completed.
            setLoading(false);

            // Now that loading has completed, allow the user to save the output to a file.
            setAllowSave(true);
            setHasSaved(false);
        },
        [handleProcessData] // Dependency on the handleProcessData callback
    );

    // Actions taken after saving the output
    const handleSaveComplete = () => {
        // Indicating that the file has saved which is passed
        // back into SaveOutputToTextFile to inform the user
        setHasSaved(true);
        setAllowSave(false);
    };

    /**
     * onSubmit: Asynchronous handler for the form submission event.
     * It sets up and triggers the bully tool with the given parameters.
     * Once the command is executed, the results or errors are displayed in the output.
     *
     * @param {FormValuesType} values - The form values, containing the interface, password list, BSSID, and ESSID.
     */
    const onSubmit = async (values: FormValuesType) => {
        setLoading(true);
        setAllowSave(false);

        if (!values.interface || !values.passwordList) {
            setOutput("Error: Please provide both the access point interface and password list.");
            setLoading(false);
            setAllowSave(true);
            return;
        }

        const args = ["-i", values.interface, "-f", values.passwordList];

        if (advancedMode) {
            if (values.bssid) {
                args.push("-b", values.bssid);
            }

            if (values.essid) {
                args.push("-e", values.essid);
            }
        }

        try {
            const { pid, output } = await CommandHelper.runCommandGetPidAndOutput("bully", args, handleProcessData, handleProcessTermination);
            setPid(pid);
            setOutput(output);
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
            setLoading(false);
            setAllowSave(true);
        }
    };

    /**
     * clearOutput: Callback function to clear the console output.
     * It resets the state variable holding the output, thereby clearing the display.
     */
    const clearOutput = useCallback(() => {
        setOutput("");
        setHasSaved(false);
        setAllowSave(false);
    }, [setOutput]);

    return (
        <>
            {!loadingModal && (
                <InstallationModal
                    isOpen={opened}
                    setOpened={setOpened}
                    feature_description={description_userguide}
                    dependencies={dependencies}
                ></InstallationModal>
            )}

            <form onSubmit={form.onSubmit(onSubmit)}>
                {LoadingOverlayAndCancelButton(loading, pid)}
                <Stack>
                    {UserGuide(title, description_userguide)}
                    <Switch
                        size="md"
                        label="Advanced Mode"
                        checked={advancedMode}
                        onChange={(e) => setAdvancedMode(e.currentTarget.checked)}
                    />
                    <TextInput label="Access Point Interface" required {...form.getInputProps("interface")} />
                    <TextInput label="Password List" required {...form.getInputProps("passwordList")} />
                    {advancedMode && (
                        <>
                            <TextInput label="MAC Address (BSSID)" {...form.getInputProps("bssid")} />
                            <TextInput label="Extended SSID (ESSID)" {...form.getInputProps("essid")} />
                        </>
                    )}
                    <Button type="submit" disabled={loading}>
                        Start Bully Attack
                    </Button>
                    {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                    <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
                </Stack>
            </form>
        </>
    );
};

export default Bully;