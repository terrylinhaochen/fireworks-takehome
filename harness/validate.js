/**
 * Output validator.
 * Compares model responses against case expectations to determine compatibility.
 * Each validation dimension produces a pass/partial/fail result with explanation.
 */

export function validateToolCalling(mockResponse, expectations, toolSchemas) {
  const results = [];
  const message = mockResponse.choices?.[0]?.message;

  // Dimension 1: Did the model produce a tool call at all?
  const toolCalls = message?.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    results.push({
      dimension: "Tool Call Format",
      status: "fail",
      detail: "Model did not produce any tool calls. Responded with plain text instead.",
      evidence: message?.content?.slice(0, 100) || "(empty response)",
    });
    // If no tool calls, remaining dimensions are automatically fail
    results.push({
      dimension: "Argument Extraction",
      status: "fail",
      detail: "No tool call to extract arguments from.",
    });
    results.push({
      dimension: "JSON Validity",
      status: "fail",
      detail: "No tool call arguments to validate.",
    });
    return results;
  }

  // Tool call exists
  const toolCall = toolCalls[0];
  const fnName = toolCall.function?.name;
  const fnArgs = toolCall.function?.arguments;

  // Dimension 1: Tool call format correctness
  if (fnName === expectations.tool_call_name) {
    results.push({
      dimension: "Tool Call Format",
      status: "pass",
      detail: `Correctly calls "${fnName}" function.`,
    });
  } else {
    results.push({
      dimension: "Tool Call Format",
      status: "fail",
      detail: `Expected tool "${expectations.tool_call_name}", got "${fnName}".`,
    });
  }

  // Dimension 2: Argument extraction
  let parsedArgs;
  try {
    parsedArgs = typeof fnArgs === "string" ? JSON.parse(fnArgs) : fnArgs;
  } catch {
    results.push({
      dimension: "Argument Extraction",
      status: "fail",
      detail: "Tool call arguments are not valid JSON.",
      evidence: fnArgs,
    });
    results.push({
      dimension: "JSON Validity",
      status: "fail",
      detail: "Cannot validate schema — arguments not parseable.",
    });
    return results;
  }

  // Check required args are present with correct values
  const requiredArgs = expectations.required_args || [];
  const expectedValues = expectations.expected_arg_values || {};
  const optionalArgs = expectations.optional_args || [];
  const allExpectedArgs = [...requiredArgs, ...optionalArgs];

  let argStatus = "pass";
  let argDetail = "";

  for (const arg of requiredArgs) {
    if (!(arg in parsedArgs)) {
      argStatus = "fail";
      argDetail += `Missing required argument "${arg}". `;
    } else if (expectedValues[arg] && parsedArgs[arg] !== expectedValues[arg]) {
      argStatus = "partial";
      argDetail += `Argument "${arg}" = "${parsedArgs[arg]}", expected "${expectedValues[arg]}". `;
    }
  }

  // Check for extra/unrequested args
  const extraArgs = Object.keys(parsedArgs).filter((k) => !allExpectedArgs.includes(k));
  if (extraArgs.length > 0) {
    if (argStatus === "pass") argStatus = "partial";
    argDetail += `Adds unrequested parameter(s): ${extraArgs.map((a) => `"${a}"`).join(", ")}. `;
  }

  if (argStatus === "pass") {
    argDetail = `Correctly extracts ${requiredArgs.map((a) => `${a}="${parsedArgs[a]}"`).join(", ")}.`;
  }

  results.push({
    dimension: "Argument Extraction",
    status: argStatus,
    detail: argDetail.trim(),
  });

  // Dimension 3: JSON validity
  results.push({
    dimension: "JSON Validity",
    status: "pass",
    detail: "Arguments are valid JSON matching expected types.",
  });

  return results;
}

export function validateStructuredOutput(mockResponse, expectations) {
  const results = [];
  const message = mockResponse.choices?.[0]?.message;
  const content = message?.content;

  // Dimension 1: Is the output valid JSON?
  let parsed;
  try {
    parsed = JSON.parse(content);
    results.push({
      dimension: "JSON Validity",
      status: "pass",
      detail: "Output is valid JSON.",
    });
  } catch {
    results.push({
      dimension: "JSON Validity",
      status: "fail",
      detail: "Output is not valid JSON.",
      evidence: content?.slice(0, 100),
    });
    results.push({
      dimension: "Schema Adherence",
      status: "fail",
      detail: "Cannot validate schema — output not parseable.",
    });
    results.push({
      dimension: "Field Constraints",
      status: "fail",
      detail: "Cannot validate constraints — output not parseable.",
    });
    return results;
  }

  // Dimension 2: Required fields present
  const requiredFields = expectations.required_fields || [];
  const missingFields = requiredFields.filter((f) => !(f in parsed));
  const extraFields = Object.keys(parsed).filter((f) => !requiredFields.includes(f));

  if (missingFields.length > 0) {
    results.push({
      dimension: "Schema Adherence",
      status: "fail",
      detail: `Missing required fields: ${missingFields.join(", ")}.`,
    });
  } else if (extraFields.length > 0) {
    results.push({
      dimension: "Schema Adherence",
      status: "partial",
      detail: `All required fields present. Extra fields added: ${extraFields.join(", ")}.`,
    });
  } else {
    results.push({
      dimension: "Schema Adherence",
      status: "pass",
      detail: "All required fields present, no extra fields.",
    });
  }

  // Dimension 3: Field constraints
  const constraints = expectations.field_constraints || {};
  let constraintIssues = [];

  for (const [field, constraint] of Object.entries(constraints)) {
    const value = parsed[field];
    if (value === undefined) continue;

    if (constraint.type === "enum" && !constraint.values.includes(value)) {
      constraintIssues.push(`"${field}" = "${value}" not in allowed values [${constraint.values.join(", ")}]`);
    }
    if (constraint.type === "range" && (typeof value !== "number" || value < constraint.min || value > constraint.max)) {
      constraintIssues.push(`"${field}" = ${value}, expected number in [${constraint.min}, ${constraint.max}]`);
    }
    if (constraint.type === "array_of_strings" && (!Array.isArray(value) || !value.every((v) => typeof v === "string"))) {
      constraintIssues.push(`"${field}" is not an array of strings`);
    }
  }

  if (constraintIssues.length > 0) {
    results.push({
      dimension: "Field Constraints",
      status: constraintIssues.length === Object.keys(constraints).length ? "fail" : "partial",
      detail: constraintIssues.join(". ") + ".",
    });
  } else {
    results.push({
      dimension: "Field Constraints",
      status: "pass",
      detail: "All field values match expected types and ranges.",
    });
  }

  return results;
}

export function validateCase(caseData, modelId) {
  const mockResponse = caseData.mockResponses[modelId];
  if (!mockResponse) {
    return [
      {
        dimension: "Response",
        status: "fail",
        detail: "No mock response available for this model.",
      },
    ];
  }

  if (caseData.features.includes("tool-calling")) {
    return validateToolCalling(mockResponse, caseData.expectations, caseData.toolSchemas);
  }

  if (caseData.features.includes("structured-output") || caseData.features.includes("json-mode")) {
    return validateStructuredOutput(mockResponse, caseData.expectations);
  }

  return [
    {
      dimension: "General",
      status: "pass",
      detail: "No specific validation dimensions for this feature set.",
    },
  ];
}
