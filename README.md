### Unipi Mediateca Downloader
This node js scripts allows to download a video category from Unipi Mediateca.

#### Instructions

To use the script you must have a local file called `credentials.json` in the directory where you downloaded the script.
Be sure to install all `node js` dependencies required from `package.json`. 

To execute the program just type:
```
node index.js download https://mediateca.unipi.it/category/calcolo-delle-probabilita-e-statistica-2016/68
```

The videos will be downloaded inside: `/home/$USER/Videos/` directory.

###### Credentials Instruction
The `credentials.json` file has to be like this:
```
{
    "username": "m.rossi",
    "password": "secret_duper_password"
}
```

made by @gabryon99
