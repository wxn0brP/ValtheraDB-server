const json2js_regex = /"([A-Za-z_$][0-9A-Za-z_$]*)"\s*:/g;
export function convertJsonToJS(jsonString) {
    return jsonString.replace(json2js_regex, '$1:');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxhQUFhLEdBQUcsbUNBQW1DLENBQUM7QUFFMUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxVQUFrQjtJQUM5QyxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3BELENBQUMifQ==