import { dialog } from '@electron/remote'
import fs from 'fs'

export default function getExcelAPIDataTemplate(APIExcelTemplateFullPath) {
    
    console.log("getExcelAPIDataTemplate")

    if(!fs.existsSync(APIExcelTemplateFullPath)) alert("APIExcelTemplateFullPath does not exist")

    var options = {
        title: "Save file",
        defaultPath : "API_template.xlsx",
        buttonLabel : "Save",
        filters :[
            {name: 'xlsx', extensions: ['xlsx']},
            {name: 'All Files', extensions: ['*']}
        ]
    };

    dialog.showSaveDialog(null, options).then(({ filePath }) => {
        if(filePath === undefined || filePath==""){
            console.log("No file selected");
            return;
        }else{
            if(fs.existsSync(APIExcelTemplateFullPath)) {
                fs.copyFileSync(APIExcelTemplateFullPath, filePath);
            }
        }
    });
    
}