const fs = require("fs").promises;
const getTheme = require("./theme");

const darkTheme = getTheme({
  style: "dark",
  name: "Intouch Dark",
});

fs.mkdir("./themes", { recursive: true })
  .then(() => fs.writeFile("./themes/dark.json", JSON.stringify(darkTheme, null, 2)))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
