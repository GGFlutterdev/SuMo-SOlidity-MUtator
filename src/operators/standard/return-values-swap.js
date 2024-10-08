const Mutation = require('../../mutation');

/**
 * RVSOperator is a mutation testing operator that focuses on swapping return values in functions.
 * 
 * **Purpose**:
 * This operator generates mutations by swapping return values in functions that have multiple return parameters. This mutation helps to test if the function and the contract can handle changes in the order of return values correctly.
 * 
 * **How It Works**:
 * 1. **Identify Functions**: The script processes functions with multiple return parameters.
 * 2. **Extract Return Values**: It retrieves the return values either from an explicit return statement or from the function's return parameters.
 * 3. **Generate Mutations**: For each pair of return values with the same type, it creates mutations by swapping their positions.
 * 4. **Store Mutations**: The mutated function code is then stored for further testing.
 */

function RVSOperator() {
  this.ID = "RVS";
  this.name = "return-values-swap";
}

RVSOperator.prototype.getMutations = function(file, source, visit) {
  const mutations = [];

  visit({
    FunctionDefinition: (node) => {

      // Ensure that the function has multiple return parameters
      if (node.returnParameters && node.returnParameters.length > 1) {

        var returnTypes = []; // Return parameter types
        var returnNode = null;

        node.returnParameters.forEach(e => {
          if (e.typeName.name) {
            returnTypes.push(e.typeName.name);
          } else if (e.typeName.type && e.typeName.type === "ArrayTypeName" && e.typeName.baseTypeName.name) {
            returnTypes.push("ArrayTypeName" + e.typeName.baseTypeName.name);
          }
        });

        // Check if the function has an explicit return statement
        if (node.body && node.body.statements) {
          var functionStatements = node.body.statements;
          for (let i = 0; i < functionStatements.length; i++) {
            if (functionStatements[i].type === "ReturnStatement") {
              returnNode = functionStatements[i];
              break;
            }
          }
        }

        var size;
        var exprStart, exprEnd;
        var lineStart, lineEnd;
        var original;
        var tokens;
        var replacement;
        
        // If the function has an explicit return structure
        if (returnNode) {
          if (returnNode.expression.components) {
            var returnValues = returnNode.expression.components; // Return values nodes
            size = returnValues.length; // Number of return values
            lineStart = returnValues[0].loc.start.line;
            lineEnd = returnValues[size - 1].loc.end.line;
            exprStart = returnValues[0].range[0];
            exprEnd = returnValues[size - 1].range[1];
            original = source.substring(exprStart, exprEnd + 1); // Return statement substring
            tokens = original.split(","); // Tokenized return values
          }
        }
        // If the function has an implicit return structure
        else {
          size = node.returnParameters.length; // Number of return parameters
          exprStart = node.returnParameters[0].range[0];
          exprEnd = node.returnParameters[size - 1].range[1];
          lineStart = node.returnParameters[0].loc.start.line;
          lineEnd = node.returnParameters[size - 1].loc.end.line;
          original = source.substring(exprStart, exprEnd + 1); // Return statement substring
          tokens = original.split(","); // Tokenized return values
        }

        // Swap return values if they have the same return type
        for (var i = 0; i < size; i++) {
          for (var j = i + 1; j < size; j++) {
            if (returnTypes[i] && returnTypes[j]) {
              // Check if the values have the same return type
              if ((returnTypes[i] == returnTypes[j]) ||
                  (returnTypes[i].startsWith("uint") && returnTypes[j].startsWith("uint")) ||
                  (returnTypes[i].startsWith("int") && returnTypes[j].startsWith("int"))) {

                // Values to be swapped
                var r1 = tokens[i].trim();
                var r2 = tokens[j].trim();

                // Check for unequal tokens
                if (r1 !== r2) {
                  if (replacement) {
                    replacement = replacement.replace(r1, "*").replace(r2, r1).replace("*", r2);
                  } else {
                    replacement = original.replace(r1, "*").replace(r2, r1).replace("*", r2);
                  }
                }
                break;
              }
            }
          }
        }

        if (replacement) {
          mutations.push(new Mutation(file, exprStart, exprEnd + 1, lineStart, lineEnd, original, replacement, this.ID));
        }
      }
    }
  });

  return mutations;
};

module.exports = RVSOperator;
