function getExcelAPIDataTemplateWrapper(){
    getExcelAPIDataTemplate(APIExcelTemplateFullPath);
}

function getExcelAPIDataTemplate(APIExcelTemplateFullPath) {
    
    console.log("getExcelAPIDataTemplate")
    console.log(APIExcelTemplateFullPath)

    // if(!fs.existsSync(APIExcelTemplateFullPath)) alert("APIExcelTemplateFullPath does not exist")

    // var options = {
    //     title: "Save file",
    //     defaultPath : "API_template.xlsx",
    //     buttonLabel : "Save",
    //     filters :[
    //         {name: 'xlsx', extensions: ['xlsx']},
    //         {name: 'All Files', extensions: ['*']}
    //     ]
    // };

    // dialog.showSaveDialog(null, options).then(({ filePath }) => {
    //     if(filePath === undefined || filePath==""){
    //         console.log("No file selected");
    //         return;
    //     }else{
    //         if(fs.existsSync(APIExcelTemplateFullPath)) {
    //             fs.copyFileSync(APIExcelTemplateFullPath, filePath);
    //         }
    //     }
    // });

    const link = document.createElement('a');
    link.href = APIExcelTemplateFullPath; // relative path from index.html
    link.download = 'API_template.xlsx'; // suggested filename
    link.click();
    
}