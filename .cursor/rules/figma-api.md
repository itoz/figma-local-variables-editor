- https://www.figma.com/plugin-docs/api/Variable/

POST variables
This API is available to full members of Enterprise orgs. To call this API on a file, you must have edit access to the file.

The POST /v1/files/:file_key/variables endpoint lets you bulk create, update, and delete variables and variable collections.

The request body supports the following 4 top-level arrays. Changes from these arrays will be applied in the below order, and within each array, by array order.

variableCollections: For creating, updating, and deleting variable collections
variableModes: For creating, updating, and deleting modes within variable collections
Each collection can have a maximum of 40 modes
Mode names cannot be longer than 40 characters
variables: For creating, updating, and deleting variables
Each collection can have a maximum of 5000 variables
Variable names must be unique within a collection and cannot contain certain special characters such as .{}
variableModeValues: For setting a variable value under a specific mode.
When setting aliases, a variable cannot be aliased to itself or form an alias cycle
Temporary ids can be used to reference an object later in the same POST request body. They can be used at create time in the id property of variable collections, modes, variables, and in the initialModeId property of variable collections. They are scoped to a single request body, and must be unique within the body. The mapping of temporary ids to real ids is returned in the response.

This endpoint has the following key behaviors:

The request body must be 4MB or less.
Must include an action property for collections, modes, and variables to tell the API whether to create, update, or delete the object.
When creating a collection, mode, or variable, you can include a temporary id that can be referenced in dependent objects in the same request. For example, you can create a new collection with the id "my_new_collection". You can then set variableCollectionId to "my_new_collection" in new modes or variables. Temporary ids must be unique in the request body.
New collections always come with one mode. You can reference this mode by setting initialModeId to a temporary id in the request body. This is useful if you want to set values for variables in the mode in the variableModeValues array.
The tempIdToRealId array returns a mapping of the temporary ids in the request, to the real ids of the newly created objects.
When adding new modes or variables, default variable values will be applied, consistent with what happens in the UI.
Everything to be created, updated, and deleted in the request body is treated as one atomic operation. If there is any validation failure, you will get a 400 status code response, and no changes will be persisted.
You will not be able to update remote variables or variable collections. You can only update variables in the file where they were originally created.
WARNING

If a string variable is bound to a text node content in the same file, and the text node uses a shared font in the organization, that variable cannot be updated and will result in a 400 response.

The below types are accepted in the request body for this endpoint:

VariableCollectionChange
An object that contains details about the desired VariableCollection change.

action"CREATE" | "UPDATE" | "DELETE"
Set this depending on the action you want to perform. Always required.
idString
Required for UPDATE or DELETE, optional for CREATE. This is the id of the target Variable Collection. For CREATE, you can provide a temporary id.
nameString
Required for CREATE, optional for UPDATE. The name of the variable collection.
initialModeIdString
Optional for CREATE. The initial mode refers to the mode that is created by default. You can set a temporary id here, in order to reference this mode later in this request.
hiddenFromPublishingBoolean default: false
Whether this variable collection is hidden when publishing the current file as a library.
VariableModeChange
An object that contains details about the desired variable mode change.

action"CREATE" | "UPDATE" | "DELETE"
Set this depending on the action you want to perform. Always required.
idString
Required for UPDATE or DELETE, optional for CREATE. This is the id of the target variable mode. For CREATE, you can provide a temporary id.
nameString
Required for CREATE, optional for UPDATE. The name of the mode.
variableCollectionIdString
Required. The variable collection that contains or will contain the mode. You can use the temporary id of a variable collection.
VariableChange
An object that represents the action you want to take with a variable.

action"CREATE" | "UPDATE" | "DELETE"
Set this depending on the action you want to perform. Always required.
idString
Required for UPDATE or DELETE, optional for CREATE. This is the id of the target variable. For CREATE, you can provide a temporary id.
nameString
Required for CREATE, optional for UPDATE. The name of the variable.
variableCollectionIdString
Required for CREATE. The variable collection that contains or will contain the variable. You can use the temporary id of a variable collection.
resolvedType"BOOLEAN" | "FLOAT" | "STRING" | "COLOR"
Required for CREATE. The resolved type of the variable.
descriptionString
Description of this variable. Optional.
hiddenFromPublishingBoolean default: false
Whether this variable is hidden when publishing the current file as a library.

If the parent VariableCollection is marked as hiddenFromPublishing, then this variable will also be hidden from publishing via the UI. hiddenFromPublishing is independently toggled for a variable and collection. However, both must be true for a given variable to be publishable.
scopesVariableScope[]
An array of scopes in the UI where this variable is shown. Setting this property will show/hide this variable in the variable picker UI for different fields.

Setting scopes for a variable does not prevent that variable from being bound in other scopes (for example, via the Plugin API). This only limits the variables that are shown in pickers within the Figma UI.
codeSyntaxVariableCodeSyntax
Code syntax definitions for this variable. Code syntax allows you to represent variables in code using platform-specific names, and will appear in Dev Mode's code snippets when inspecting elements using the variable.
VariableModeValue
An object that represents a value for a given mode of a variable. All properties are required.

variableIdString
The target variable. You can use the temporary id of a variable.
modeIdString
Must correspond to a mode in the variable collection that contains the target variable.
valueBoolean | Number | String | Color | VariableAlias
The value for the variable. The value must match the variable's type. If setting to a variable alias, the alias must resolve to this type.

HTTP Endpoint
POST/v1/files/:file_key/variables

Path parameters Description
file_key String
File to modify variables in. This can be a file key or branch key. Use GET /v1/files/:key with the branch_data query param to get the branch key.
Body parameters Description
variableCollections VariableCollectionChange[]optional
For creating, updating, and deleting variable collections.
variableModes VariableModeChange[]optional
For creating, updating, and deleting modes within variable collections.
variables VariableChange[]optional
For creating, updating, and deleting variables.
variableModeValues VariableModeValue[]optional
For setting a specific value, given a variable and a mode.
Error codes Description
400 Invalid parameter, the "message" property will indicate which parameter is invalid
403 API is not available. Possible error messages are "Limited by Figma plan", "Incorrect account type", "Invalid scope", "Insufficient file permissions", or "API only available for design files". This could also indicate the developer / OAuth token is invalid or expired.
404 The specified file was not found
413 Request payload too large. The max allowed body size is 4MB.

Examples
The following examples are request bodies for the POST variables endpoint.

To create a new variable collection:

{
"variableCollections": [
{
"action": "CREATE",
"name": "Example variable collection"
}
]
}
To create a variable in an existing variable collection:

{
"variables": [
{
"action": "CREATE",
"name": "New Variable",
"variableCollectionId": "VariableCollectionId:1:2",
"resolvedType": "FLOAT"
}
]
}
To create a variable mode in an existing variable collection:

{
"variableModes": [
{
"action": "CREATE",
"name": "New Mode",
"variableCollectionId": "VariableCollectionId:1:2"
}
]
}
To set a value for an existing variable:

{
"variableModeValues": [
{
"variableId": "VariableID:2:3",
"modeId": "1:0",
"value": { "r": 1, "g": 0, "b": 0 }
}
]
}
To set a variable alias to an existing variable:

{
"variableModeValues": [
{
"variableId": "VariableID:2:4",
"modeId": "1:0",
"value": { "type": "VARIABLE_ALIAS", "id": "VariableID:1:3"}
}
]
}
To rename an existing variable:

{
"variables": [
{
"action": "UPDATE",
"id": "VariableID:1:3",
"name": "New Variable"
}
]
}
To set code syntax for a variable:

{
"variables": [
{
"action": "UPDATE",
"id": "VariableID:1:3",
"codeSyntax": { "WEB":
"variable-name",
"ANDROID": "variableName",
"iOS": "variableName"
}
}
]
}
To rename an existing variable mode:

{
"variableModes": [
{
"action": "UPDATE",
"id": "1:0",
"name": "New Mode Name",
"variableCollectionId": "VariableCollectionId:1:2"
}
]
}
To create a new variable collection that contains a variable:

{
"variableCollections": [
{
"action": "CREATE",
"id": "my_variable_collection", // sets a temporary id for the variable collection
"name": "New Variable Collection",
"initialModeId": "my_mode" // sets a temporary id for the initial variable mode
}
],
"variableModes": [
{
"action": "UPDATE",
"id": "my_mode",
"name": "My Mode", // rename the initial variable mode
"variableCollectionId": "my_variable_collection" // uses the temporary id of the variable collection
}
],
"variables": [
{
"action": "CREATE",
"id": "my_variable",
"name": "float variable",
"resolvedType": "FLOAT",
"variableCollectionId": "my_variable_collection" // uses the temporary id of the variable collection
}
],
"variableModeValues": [
{
"variableId": "my_variable", // uses the temporary id of the variable
"modeId": "my_mode", // uses the temporary id of the variable mode
"value": 100
}
]
}
To delete a variable mode:

{
"variableModes": [
{
"action": "DELETE",
"id": "2:0",
"variableCollectionId": "VariableCollectionId:2:3"
}
]
}
