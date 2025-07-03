# GET file

- https://www.figma.com/developers/api#global-properties

Returns the document referred to by :key as a JSON object. The file key can be parsed from any Figma file url: https://www.figma.com/:file_type/:file_key/:file_name. The name, lastModified, thumbnailUrl, editorType, linkAccess, and version attributes are all metadata of the retrieved file. The document attribute contains a Node of type DOCUMENT.

The components key contains a mapping from node IDs to component metadata. This is to help you determine which components each instance comes from.

HTTP Endpoint
GET/v1/files/:key
