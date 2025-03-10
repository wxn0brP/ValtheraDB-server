const json2js_regex = /"([A-Za-z_$][0-9A-Za-z_$]*)"\s*:/g;

export function convertJsonToJS(jsonString: string): string {
    return jsonString.replace(json2js_regex, '$1:');
}