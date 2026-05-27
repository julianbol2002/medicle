import re
import os

def format_case(case_text):
    lines = case_text.strip().split("\n")

    output = []
    section = None
    vignette_counter = 1

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Headers
        if line.startswith("CASE_ID"):
            output.append(line)
        elif line.startswith("DIFFICULTY"):
            output.append(line)
        elif line.startswith("SYSTEM"):
            output.append(line)
            output.append("")

        elif line == "DIAGNOSIS:":
            output.append("")
            output.append("DIAGNOSIS:")
            section = "diagnosis"

        elif line == "ALIASES:":
            output.append("")
            output.append("ALIASES:")
            section = "aliases"

        elif line == "VIGNETTE_LINES:":
            output.append("")
            output.append("VIGNETTE_LINES:")
            section = "vignette"
            vignette_counter = 1

        elif line == "TEACHING_POINTS:":
            output.append("")
            output.append("TEACHING_POINTS:")
            section = "teaching"

        else:
            if section == "vignette":
                if line.startswith("-"):
                    cleaned = line.lstrip("- ").strip()
                    output.append(f"{vignette_counter}. {cleaned}")
                    vignette_counter += 1
                else:
                    output.append(line)

            elif section in ["aliases", "teaching", "diagnosis"]:
                output.append(line)

            else:
                output.append(line)

    output.append("")
    output.append("==================================================")
    return "\n".join(output)


def process_file(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # split cases
    cases = re.split(r"=+\s*", content)

    formatted_cases = []

    for case in cases:
        case = case.strip()
        if case:
            formatted_cases.append(format_case(case))

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(formatted_cases))


if __name__ == "__main__":
    # ✅ your exact file name (no changes needed)
    input_file = "cases_master_250.txt"

    # ✅ auto new output file
    output_file = "cases_master_250_FORMATTED.txt"

    process_file(input_file, output_file)

    print("✅ Done!")
    print(f"Output file created: {output_file}")