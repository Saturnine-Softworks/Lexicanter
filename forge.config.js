const path = require('path');

module.exports = {
    packagerConfig: {
      icon: path.resolve(__dirname, 'src/rsrc/Quill Icon') // no extension required
    },
    makers: [
        {
          name: "@electron-forge/maker-squirrel",
          platforms: ["win32"],
          config: {
            name: "LexicanterSetup",
            iconURL: "https://lexicanter.com/rsrc/Quill%20Icon.ico"
          }
        },
        {
          name: "@electron-forge/maker-zip",
          platforms: [
            "darwin"
          ]
        },
        {
          name: "@electron-forge/maker-deb",
          config: {}
        },
        {
          name: "@electron-forge/maker-rpm",
          config: {}
        }
      ]
}