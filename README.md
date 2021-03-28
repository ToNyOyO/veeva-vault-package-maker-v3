```diff
- DO NOT BORK MY REPO 
+ Press the *Use this template* button
``` 

- [Quick start guide](#Quick-start)

- [Things you need to install](#Prerequisits )

- [Gulp Tasks](#Gulp-Tasks-and-Workflow)

# Veeva Vault CLM Presentation tool 

*All of this is subject to change as development continues but the idea was to create something simple that just works* 

#### Design philosophy 

This is not an all-encompassing tool, made to do everything for you. This is just a collection of tasks to remove the drudgery of making Veeva presentations. That's all it's meant to do. 

If there's something I need to do more than once, and it's a faff to do, I'll probably extend this to automate that. Like renaming a Key Message: Once or twice is fine, but twice, across four presentations? For all these files?! Uff... That needs a tool. 

## What does it do?  
>This will create the project structure based on using Shared Resources rather than resources per Key Message, and using a pre-defined HTML/LESS/JS template structure. 
>
>Generate a .csv file and ZIPs compatible with Vault MC Loader
> 
>As long as all your LESS files are in `shared`>`less` and are `imported` into `default.less` and your JS files are in `shared`>`js` they will be packaged correctly. 
>
>Switches off the `anims.less` file if the user is presenting via Engage

## What does it NOT do?
>It does not screen grab your thumbnail/poster images for you. 
>
>It will not make your bed either. 

## Quick start...
- Run `npm install`
- Run `gulp setup`
- Fill out `config.json`
- Then start creating your pages: 
  - Run `gulp keymessage --new "Key Message Name"` for each Key Message
  - First time this is run it will also create CLM Presentation and Shared resources

To change the page order in Vault you can rearrange the order of the pages in `./keymessages.json`

- You can add links to slides in other Veeva presentations: 
  - Run `gulp link --km "key-message-name.zip" --method "nameOfMethod" --id "123-presentation-ID"` 
- Create poster and thumbnail images:
  - Drop your screen grabs into each Key Message folder in `./source/previews` and run `gulp previews` (this will work for png or jpg and the screen grab filename is irrelevant)
- Rename existing Key Message:
  - Run `gulp rename --from "Old name" --to "New name"`
  - Renames all associated files/folders as they were created
  
> If this confuses you then check the [Gulp Tasks](#Gulp-Tasks-and-Workflow) and read through the documentation thoroughly. 

## Settings
### *Amend the config file!*
Fill in the required information in the new `config.json` or **nothing will work!** (the dates are optional everything else is required). 

The file `prefix` is generally the first three characters of the product (e.g., `CUV` = Cuvitru) and for Engage specific versions add and E (e.g., `CUV-E` = Cuvitru for Engage). 

The `externalId` can be any alphanumeric gibberish you like. Generally I make the `sharedResourceExternalId` the same as the `externalId` because why not. 

```
{
    "presentationName": "",
    "forEngage": "TRUE",
    "prefix": "",
    "externalId": "",
    "presentationStartDate": "",
    "presentationEndDate": "",
    "productName": "",
    "countryName": "United Kingdom",
    "countryTPI": "UK",
    "language": "English",
    "sharedResourceExternalId": ""
}
```

The `prefix` key will be prepended to both the `Presentation Link` and the `slide.related_shared_resource__v` fields in each keymessage json file. The presentation title will also be prefixed with this when uploaded to Vault. 

## File structure
This will be generated when you run `$ gulp setup`
```
root/
|—— build/
|—— dist/
|—— source/
|   |—— previews/
|   |—— shared/
|   |   |—— less/
|   |   |   |—— keymessages/
|   |   |—— fonts/
|   |   |—— imgs/
|   |   |—— js/
|   |—— your.html
|   |—— key.html
|   |—— messages.html
|—— keymessages/
|—— templates/
|
|—— config.json
|—— gulfile.js
|—— package.json
```

---

## Gulp Tasks and Workflow

### Overview

#### Tasks
Menu | Gulp task | Action
---- | --------- | ------
[Read](#Setup) | `$ gulp setup`  | Setup folders and config.json
[Read](#Watch) | `$ gulp`  | Watch the `src` folder for changes
[Read](#Build-project) | `$ gulp build` | Build for local testing 
[Read](#Package-project) | `$ gulp dist` | Package for Vault deployment 

#### Utility tasks
Menu | Gulp task | Action
---- | --------- | ------
[Read](#Create-keymessage) | `$ gulp keymessage --new "Key Message name" [--nonav]` | Add a Key Message to the project, Create CLM Presentation json file, Create CLM Pres shared resources json
[Read](#Add-link-to-presentation) | `$ gulp link --km "key-message-name.zip" --method "nameOfMethod" --id "123-presentation-ID"` | Add a link to a slide in another Veeva presentation
[Read](#Rename-keymessage) | `$ gulp rename --from "Old name" --to "New name"` | Rename a Key Message and associated files
[Read](#Regenerate-keymessages) | `$ gulp regen` | Regenerate the Key Message json files
[Read](#Generate-previews) | `$ gulp previews` | Process screen grabs into poster/thumbnail images

---

# In depth

#### Setup

```
$ gulp setup
```
- Template a `config.json` for your project defaults
- Add a `.gitignore` file
- Create a `source` folder for storing your working files
- Template the LESS files in `source`>`shared`>`less`
- Template the JS files in `source`>`shared`>`js`
- Create a `build` folder for viewing your presentation
- Create a `dist` folder for Vault content ZIPs
- Create a `source`>`previews` folder for thumbs and posters

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Watch
```
$ gulp
```
Watch the `src` files for changes and run the `build` command automatically. 

You may like to implement something to refresh your browser when this command runs but I prefer to press F5 myself. Here's an example of how to implement a live reload if that's what you're into: <https://stackoverflow.com/questions/43415506/how-to-make-a-refresh-in-browser-with-gulp/43463567>

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Build project

```
$ gulp build
``` 
- Combine LESS files, minify css and minify JS
- Adds Left/Right navigation buttons to header (removed when packaged for distribution)

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Package project

```
$ gulp dist
```
- Packages all the project files into the `dist` folder ready for upload to Vault
- This means: 
  - Pull all the shared resources (CSS, JS, Fonts, Images) into a ZIP and place into the `dist` folder
  - Package each Key Message in it's own ZIP, along with it's thumb and poster images, and place in the `dist` folder
- Uses the Key Message JSON files to generate a Vault MC Loader file (this will appear in the `dist` folder)

##### And now? 
- Chuck the CSV file, found in the `dist` folder, at the Vault MC Loader and watch it successfully get verified
- Upload your ZIP files from the `dist` folder too
- Sit back and relax 

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Create keymessage

```
$ gulp keymessage --new "Key Message name" [--nonav]
```
- Requires that you have filled in the `config.json` file! 
- Creates the Key Message JSON file for use in the Vault MC Loader .csv file 
- Creates the Key Message HTML file at root 
- Creates template thumb and poster images in the `previews` folder
- Adds a Key Message LESS file for this page in `source`>`shared`>`less`>`keymessages` (also adds a link into `default.less` and `anims.less`)
- Inserts a method to capture menu interaction for the new keymessage (`app.js`) and you'll want to add a class to your menu link that matches the pattern `goTo-FilenameInCamelcase` 
- Adds the `goTo-FilenameInCamelcase` link into the `nav.html` partial for you. Nav highlighting is controlled by jQuery setting an `active` class for the current page (experimental!)
- Using the optional `--nonav` you can suppress adding the link to `nav.html`

##### If this is the first Key Message this will also create some required files 

The Vault MC Loader requires that the Presentation be part of the .csv file and that the Shared Resources be part of the .csv file and uploaded in the same way as a Key Message: 
- Generate the CLM Presentation Key Message JSON file for use in the Vault MC Loader .csv file 
- Creates the shared resources Key Message JSON file for use in the Vault MC Loader .csv file 

##### Once you've added a Key Message you can start adding your CLM Presentation content

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Add link to presentation

```
gulp link --km "key-message-name.zip" --method "nameOfMethod" --id "123-presentation-ID" 
```
- Inserts a method to capture interaction for the new link (`app.js`) and you'll want to add a class to your link that matches the pattern `goTo-nameOfMethod` 
- The `--id` must match the `Presentation Id` as set in Vault/Salesforce
- `--km` must be an existing key message (will also add `.zip` to the end if you don't)
- The `--method` will be forced to camel case, hyphens and spaces will be removed

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Rename keymessage

```
gulp rename --from "Old key message" --to "New key message"
```
- Renames HTML and LESS file
- Changes CSS page ID in the LESS and HTML files
- Updates the `.goTo-` in `./source/shared/js/app.js` and in the Key Message HTML file
- Renames the `./source/previews` folder for this Key Message

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Regenerate keymessages

```
gulp regen
```
- Regenerates the Key Message json files in `./keymessages`

[Back to menu](#Gulp-Tasks-and-Workflow)

---

#### Generate previews

```
gulp previews
```
- Converts each Key Message screen grab into the poster and thumbnail for that Key Message
- Place your screen grab file into the `./source/previews/your-key-message` folder
- The screen grab should be either jpg or png
- The screen grab filename doesn't matter but shouldn't be "poster" or "thumbnail"

[Back to menu](#Gulp-Tasks-and-Workflow)

## 

# Prerequisits 

You need to install both ImageMagick and GraphicsMagick if you want to use the `gulp previews` command. 

[Back to top](#Veeva-Vault-CLM-Presentation-tool)

## Windows Installers 

#### ImageMagick

Instructions: [https://imagemagick.org/](https://imagemagick.org/) 

Installer(s):

- [https://imagemagick.org/download/binaries/ImageMagick-7.0.10-10-Q16-x64-dll.exe](https://imagemagick.org/download/binaries/ImageMagick-7.0.10-10-Q16-x64-dll.exe)

#### GraphicsMagick

Instructions: [http://www.graphicsmagick.org/](http://www.graphicsmagick.org/) 

Installer(s):

- [ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/GraphicsMagick-1.3.35-Q8-win64-dll.exe](ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/GraphicsMagick-1.3.35-Q8-win64-dll.exe)

- [ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/GraphicsMagick-1.3.35-Q8-win64-dll.exe.sig](ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/GraphicsMagick-1.3.35-Q8-win64-dll.exe.sig)