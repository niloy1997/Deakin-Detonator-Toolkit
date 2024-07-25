import sys
import json
import subprocess
import time
import os

def run_command(command, message, sudo=False, return_output=False):
    """
    Executes a shell command.

    Args:
        command (str): The command to be executed.
        message (str):The message to show to the user of the current step.
        sudo (bool, optional): Whether to run the command with sudo. Defaults to False.
        return_output (bool, optional): Whether to return command output. Defaults to False.
    
    Returns:
        tuple: return code and output of the command if return_output is True.
    """

    global TOTAL_STEPS
    global DEBUG
    global current_step

    # Print the loading bar.
    print_loading_bar(current_step, message, TOTAL_STEPS)

    # Add optional sudo
    if sudo:
        command = f"sudo {command}"

    # Run the command and optionally capture output.
    if DEBUG or return_output:
        result = subprocess.run(command, shell=True, capture_output=return_output, text=True)
    else:
        result = subprocess.run(command, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Increment the current step counter.
    current_step += 1

    # Return the result if requested.
    if return_output:
        return result.returncode, result.stdout.strip()

def print_loading_bar(iteration, message, total, length=50):
    """
    Prints a loading bar to indicate the progress of an iteration.

    Parameters:
    - iteration (int): The current iteration.
    - message (str): The message to be displayed.
    - total (int): The total number of iterations.
    - length (int): The length of the loading bar (default is 50).

    Returns:
    None
    """

    # Initialise global variables within the function.
    global last_step_message, DEBUG

    percent = int(iteration / total * 100)               # Calculate the percentage of the total iterations.
    bar_length = int(length * iteration / total)         # Calculate the length of the loading bar.
    bar = "=" * bar_length + "-" * (length - bar_length) # Create the loading bar.

    # Clear the terminal if debug mode is not enabled.
    # This prevents the terminal from being cluttered with output.
    if not DEBUG:
        os.system('clear')

    # Print the loading bar.
    # If the iteration is the last iteration, print the last step message.
    if iteration == total:
        sys.stdout.write(f"\r\033[K{last_step_message} (Complete)\n")
        sys.stdout.flush()

    # If the iteration is not the last iteration, print the current step message.
    else:
        sys.stdout.write(f"{last_step_message} (Complete)\n")   # Print the last step message.
        last_step_message = message                             # Update the last step message.
        sys.stdout.write(f"{message} (In Progress)\n")          # Print the current step message.
        sys.stdout.write(f"[{bar}] {percent}% Complete\n")      # Print the loading bar.
        sys.stdout.flush()                                      # Flush the output buffer.

def new_terminal(command, message, title="Terminal", sudo=False):
    """
    Opens a new terminal window and executes the given command.

    Args:
        command (str): The command to be executed in the new terminal window.
        message (str): The message to be displayed before executing the command.
        title (str, optional): The title of the new terminal window. Defaults to "Terminal".
        sudo (bool, optional): Whether to run the command with sudo privileges. Defaults to False.
    """

    # Initialise global variables within the function.
    global DEBUG

    # Print the loading bar.
    # If debug mode is enabled, maintain the terminal. 
    if DEBUG:
        run_command(f"gnome-terminal --title='{title}' -- bash -c '{command}; exec bash'", message, sudo)
    
    # If debug mode is not enabled, close the terminal after the command has been executed.
    else:
        run_command(f"gnome-terminal --title='{title}' -- bash -c '{command}'", message, sudo)

def sleep_time(seconds, message):
    """
    Sleep for the specified number of seconds and display a countdown message.

    Parameters:
    - seconds (int): The number of seconds to sleep.
    - message (str): The message to display during the countdown.

    Returns:
    None
    """

    # Iterate over the number of seconds provided as an argument.
    for i in range(seconds, 0, -1):
        sys.stdout.write(f"\r\033[K{message}. Waiting {i} seconds...") # Print the countdown message.
        sys.stdout.flush()                                             # Flush the output buffer.
        time.sleep(1)                                                  # Sleep for 1 second.

    sys.stdout.write("\r\033[K")                                       # Clear the line after the countdown
    sys.stdout.flush()                                                 # Flush the output buffer.

def check_sudo():
    """
    Checks if the script is running with sudo.

    Returns:
        bool: Whether the script is running with sudo.
    """

    # If the user ID is 0, the script is running with sudo.
    return os.geteuid() == 0

def install_prereq(name, check_command, install_command, path_variable, sleep_time_duration):
    """
    Function to check if a prerequisite software is installed and install it if not.

    Args:
        name (str): The name of the software.
        check_command (str): The command to check if the software is installed.
        install_command (str): The command to install the software.
        path_variable (str): The path variable to set after installation.
        sleep_time_duration (int): The duration to wait after installation.
    """
    global current_step

    def check_installed():
        result = run_command(check_command, f"Checking if {name} is installed...", return_output=True)
        return_code = result[0]
        return return_code == 0

    def install():
        global current_step
        message = f"Installing {name}..."
        new_terminal(install_command, message, f"{name} Install Terminal")

        message = f"Setting {name} PATH variable..."
        print_loading_bar(current_step, message, TOTAL_STEPS)
        os.environ["PATH"] = f"{os.path.expanduser('~')}/{path_variable}:{os.environ['PATH']}"
        current_step += 1

        sleep_time(sleep_time_duration, f"Allowing time for {name} to install")

    if not check_installed():
        install()
    else:
        print(f"{name} is already installed. Skipping {name} installation.")

# Establish global variables.
global TOTAL_STEPS 
global DEBUG
global last_step_message
global current_step

# Initialise constants.
TOTAL_STEPS = 13    # Total number of steps
DEBUG = True       # Whether to show debug information.
SLEEP_TIME = 20     # The number of seconds to sleep for.

# Initialise local variables.
current_step = 0                            # Iterable. Current step counter.
last_step_message = "Start Install Tool"    # The message of the last step.

# This script manually executes specific commands with sudo permissions.
# Therefore, it should not be run with sudo.
# If the command is run with sudo, the script will exit.
if (check_sudo()):
    print("Please do not run this script with sudo. Exiting...")
    exit()

# Get sudo permissions.
message = "Checking for sudo permissions..."
run_command("-v", message, True)

# Clone the repository and install dependencies.
message = "Downloading the Deakin Detonator Toolkit..."
run_command("git clone https://github.com/Hardhat-Enterprises/Deakin-Detonator-Toolkit", message)

# Temporary commands for functionality testing.
# TODO: Remove these commands.
# run_command("mv ./dependencies.json ./Deakin-Detonator-Toolkit/dependencies.json", "Moving dependencies.json to the DDT directory.")
# run_command("mv ./start-ddt.sh ./Deakin-Detonator-Toolkit/start-ddt.sh", "Moving start-ddt.sh to the DDT directory.")

# Read packages from the dependencies JSON file.
message = "Reading the list of software dependencies..."
print_loading_bar(current_step, message, TOTAL_STEPS)

# Read the dependencies from the JSON file. This is used to install the required software.
# TODO: Add a method to check if the software is already installed.
# Loads the json file into a dictionary.
with open("./Deakin-Detonator-Toolkit/install-update-media/dependencies.json", "r") as json_file:
    data = json.load(json_file)
    packages = data["packages"]
current_step += 1

# Update and upgrade the system
message = "Updating the system information..."
run_command("apt update", message, True)

# Upgrade the host.
message = "Upgrading the system (this may take a while)..."
run_command("apt upgrade --fix-missing -y", message, True)

# Install the packages.
message = "Installing the required software dependencies..."
run_command(f"apt install {' '.join(packages)} -y", message, True)

# Check and install Rust
install_prereq(
    name="Rust",
    check_command="rustc --version",
    install_command='curl --proto "=https" --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y',
    path_variable=".cargo/bin",
    sleep_time_duration=SLEEP_TIME
)

# Check and install Volta
install_prereq(
    name="Volta",
    check_command="volta --version",
    install_command='curl https://get.volta.sh | bash',
    path_variable=".volta/bin",
    sleep_time_duration=SLEEP_TIME
)

# Check and install Node.js
install_prereq(
    name="Node.js",
    check_command="node --version",
    install_command='volta install node',
    path_variable=".volta/bin",
    sleep_time_duration=SLEEP_TIME
)

# Check and install Yarn
install_prereq(
    name="Yarn",
    check_command="yarn --version",
    install_command='volta install yarn',
    path_variable=".volta/bin",
    sleep_time_duration=SLEEP_TIME
)

os.chdir("./Deakin-Detonator-Toolkit")
message = "Starting the Deakin Detonator Toolkit..."
new_terminal("sh ./install-update-media/start-ddt.sh", message, "DDT Terminal")

message = "Install DDT (Complete).\n\n"
print_loading_bar(current_step, message, TOTAL_STEPS)