module.export ={

    coverageReporters:[
        "lcov", "text"
    ],
    testPathIgnorePatterns:[
        'other',
        'images',
        'node_modules',
        '.vscode'
    ],
    coverageThreshold:{
        global:{
            branches:90,
            functions:90,
            lines:90,
            statements:80
        }
    }
}