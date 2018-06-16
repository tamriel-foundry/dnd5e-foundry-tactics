//sync.render("ui_editPage", function(obj, app, scope){
// function render_page_edit_original(obj, app, scope) {
//   if (!obj) {
//     var retDiv = $("<div>");
//
//     var butt = $("<button>Click to Refresh</button>");
//     butt.click(function(){
//       retDiv.empty();
//       retDiv.append(sync.render("ui_editPage")(obj, app, scope));
//     });
//     butt.appendTo(retDiv);
//
//     sync.render("ui_entList")(obj, app, {
//       filter : "p",
//       click : function(ev, ui, ent) {
//         ent.addApp(app);
//       }
//     }).appendTo(retDiv);
//
//     return retDiv;
//   }
//   var data = obj.data;
//   var info = data.info;
//
//   if (info.img.modifiers && data._t != "c") {
//     sync.modifier(obj.data.info.notes, "style", duplicate(info.img.modifiers));
//     delete obj.data.info.img.modifiers;
//   }
//
//   scope = scope || {viewOnly: (app.attr("viewOnly") == "true"), autoSave : app.attr("autoSave") == "true", entry : app.attr("entry") == "true", hideOptions : app.attr("hideOptions") == "true"};
//
//   if (game.locals[app.attr("id")+"-edit-page"] != null) {
//     data = game.locals[app.attr("id")+"-edit-page"].data;
//     info = game.locals[app.attr("id")+"-edit-page"].data.info;
//   }
//   else {
//     game.locals[app.attr("id")+"-edit-page"] = game.locals[app.attr("id")+"-edit-page"] || sync.obj();
//     game.locals[app.attr("id")+"-edit-page"].data = duplicate(obj.data);
//   }
//
//   var div = $("<div>");
//   div.addClass("flexcolumn fit-y");
//
//   var optionsBar = $("<div>").appendTo(div);
//   optionsBar.addClass("background alttext flexrow flexbetween");
//   if (scope.noOptions) {
//     optionsBar.hide();
//   }
//
//   if (obj.data._t != "c") {
//     var namePlate = $("<div>").appendTo(optionsBar);
//     namePlate.addClass("flexrow flexmiddle");
//
//     var config = $("<div>").appendTo(namePlate);
//     config.addClass("flexcolumn flexmiddle lrmargin");
//
//     var security = genIcon("lock").appendTo(config);
//     security.attr("title", "Configure who can access this");
//     security.click(function(){
//       var content = sync.newApp("ui_rights");
//       obj.addApp(content);
//
//       var frame = ui_popOut({
//         target : $(this),
//         prompt : true,
//         align : "bottom",
//         id : "ui-rights-dialog",
//       }, content);
//     });
//
//     var del = genIcon("refresh").appendTo(config);
//     del.addClass("destroy bold");
//     del.attr("title", "Clear Notes");
//     del.click(function(){
//       ui_prompt({
//         target : $(this),
//         confirm : "Confirm Delete",
//         click : function() {
//           sync.rawVal(obj.data.info.notes, "");
//           obj.sync("updateAsset");
//         }
//       });
//     });
//
//     var imgWrap = $("<div>").appendTo(namePlate);
//     imgWrap.addClass("flex flexcolumn lrmargin");
//     imgWrap.css("width", "35px");
//     imgWrap.css("height", "35px");
//
//     var img = sync.render("ui_image")(obj, app, {lookup : "info.img", viewOnly : scope.viewOnly}).appendTo(imgWrap);
//     img.addClass("white smooth outline");
//
//     var nameWrap = $("<div>").appendTo(namePlate);
//     nameWrap.addClass("flexrow lrmargin");
//
//     var title = genInput({
//       parent : nameWrap,
//       classes : "line",
//       title : "Change this page's name",
//       value : sync.rawVal(obj.data.info.name),
//     });
//     title.attr("title", "Change this page's Name");
//     title.change(function(){
//       sync.rawVal(obj.data.info.name, $(this).val());
//       obj.sync("updateAsset");
//     });
//
//     if (obj.data._t == "p") {
//       var select = $("<select>").appendTo(nameWrap);
//       select.addClass("subtitle lrmargin");
//       select.css("width", "100px");
//       select.css("color", "#333");
//       select.css("text-shadow", "none");
//
//       for (var key in util.resourceTypes) {
//         select.append("<option>"+key+"</option>");
//       }
//       select.children().each(function(){
//         if ($(this).text() == sync.rawVal(obj.data.info.mode)) {
//           $(this).attr("selected", "selected");
//         }
//       });
//       select.change(function(){
//         if (!obj.data.info.mode) {
//           obj.data.info.mode = sync.newValue("Mode");
//         }
//         sync.rawVal(obj.data.info.mode, $(this).val());
//         obj.sync("updateAsset");
//       });
//
//       var live = genIcon("eye-open", "View").appendTo(nameWrap);
//       live.addClass("lrmargin subtitle flexmiddle");
//       live.attr("title", "Creates a popup previewing your changes");
//       live.css("text-align", "left");
//       live.click(function(){
//         var content = sync.newApp("ui_renderPage");
//         content.attr("viewOnly", "true");
//         content.attr("preview", "true");
//         game.locals[app.attr("id")+"-edit-page"].addApp(content);
//
//         var pop = ui_popOut({
//           target : app,
//           id : "live-preview-"+app.attr("id"),
//           align : "right",
//           title : "Live Preview",
//           style : {width : assetTypes["p"].width, height : assetTypes["p"].height},
//         }, content);
//         pop.resizable();
//       });
//
//       /*
//       var recover = genIcon("refresh", "Recover").appendTo(recoverWrap);
//       recover.attr("title", "Check the caches for a backup");
//       recover.click(function(){
//         var list = $("<div>");
//         list.addClass("flexcolumn");
//
//         for (var key in game.locals) {
//           if (key.match("-edit-page") && game.locals[key]) {
//             var optionWrap = $("<div>").appendTo(list);
//             optionWrap.addClass("spadding outline smooth hover2 bold flexmiddle");
//             optionWrap.append(sync.rawVal(game.locals[key].data.info.name));
//             optionWrap.attr("key", key);
//             optionWrap.click(function(){
//               var key = $(this).attr("key");
//               var content = $("<div>");
//               content.addClass("flexcolumn flex");
//
//               var render = sync.newApp("ui_renderPage").appendTo(content);
//               render.attr("viewOnly", true);
//               game.locals[key].addApp(render);
//
//               var confirm = $("<button>").appendTo(content);
//               confirm.addClass("highlight alttext spadding");
//               confirm.append("Restore to this version");
//               confirm.click(function(){
//                 var old = duplicate(obj.data.info);
//                 obj.data.info = duplicate(game.locals[key].data.info);
//                 game.locals[key].data.info = old;
//                 obj.update();
//                 layout.coverlay(key+"-recover");
//               });
//
//               var pop = ui_popOut({
//                 target : app,
//                 id : key+"-recover",
//                 align : "right",
//                 style : {"width" : assetTypes["p"].width, "height" : assetTypes["p"].height}
//               }, content);
//               pop.resizable();
//             });
//           }
//         }
//
//         var pop = ui_popOut({
//           target : app,
//           id : app.attr("id")+"-recover",
//         }, list);
//         pop.resizable();
//       });
//       */
//     }
//   }
//
//   var content = $("<div>").appendTo(div);
//   content.addClass("flexcolumn flex");
//   if (sync.rawVal(obj.data.info.mode) == "HTML") {
//     var editorContent;
//     content.append("<b class='lrpadding'>Macro Context</b>");
//
//     var macro = $("<textarea>").appendTo(content);
//     macro.addClass("fit-x subtitle");
//     macro.attr("placeholder", "Macro Context");
//     macro.val(sync.modifier(obj.data.info.mode, "macro"));
//
//     content.append("<b class='lrpadding'>HTML (No Javascript)</b>");
//     editorContent = $("<textarea>").appendTo(content);
//     editorContent.addClass("flex subtitle");
//     editorContent.attr("id", "adventure-editor-"+app.attr("id"));
//     editorContent.attr("placeholder", "Reference Macro Variables with {{{@variable}}}");
//     editorContent.val(sync.rawVal(info.notes));
//
//     var examples = $("<div>").appendTo(content);
//     examples.addClass("flexaround subtitle");
//
//     var spaceWars = $("<a>").appendTo(examples);
//     spaceWars.text("Checkout or example : Space Wars Intro!");
//     spaceWars.click(function(){
//       macro.val("$col=#feda4a;$title=Episode Fourge;$subtitle=Fourge;$line1=In the distance, you see them approaching;$line2='';$line3='';");
//       editorContent.val(spacewars);
//       macro.change();
//       editorContent.change();
//     });
//     var saveWrap = $("<div>").appendTo(optionsBar);
//     saveWrap.addClass("flexcolumn flexmiddle lrmargin");
//
//     if (obj.data._t == "p") {
//       var save = genIcon("book", "Finalize").appendTo(saveWrap);
//       save.attr("title", "Finalize Page");
//       save.click(function(){
//         app.attr("from", "ui_editPage");
//         app.attr("ui-name", "ui_renderPage");
//         sync.modifier(obj.data.info.mode, "macro", macro.val());
//         sync.rawVal(obj.data.info.notes, editorContent.val());
//         obj.sync("updateAsset");
//         game.locals[app.attr("id")+"-edit-page"] = null;
//       });
//     }
//
//     var save = genIcon("floppy-disk", "Save ");
//     save.appendTo(saveWrap);
//     save.attr("title", "Save Changes");
//     save.click(function(){
//       if (app.attr("targetApp")) {
//         $("#"+app.attr("targetApp")).removeAttr("viewingNotes");
//       }
//
//       save.text("Save");
//       sync.modifier(obj.data.info.mode, "macro", macro.val());
//       sync.rawVal(obj.data.info.notes, editorContent.val());
//       obj.sync("updateAsset");
//       game.locals[app.attr("id")+"-edit-page"] = null;
//       if (app.attr("saveClose")) {
//         layout.coverlay(app.attr("saveClose"));
//       }
//     });
//
//     macro.keyup(function(){
//       sync.modifier(game.locals[app.attr("id")+"-edit-page"].data.info.mode, "macro", $(this).val());
//       game.locals[app.attr("id")+"-edit-page"].update();
//
//       if (scope.autoSave) {
//         sync.modifier(obj.data.info.notes, "macro", $(this).val());
//       }
//       else {
//         save.get(0).innerHTML = save.get(0).innerHTML.replace("Save ", "Save*");
//       }
//     });
//
//     editorContent.keyup(function(){
//       sync.rawVal(game.locals[app.attr("id")+"-edit-page"].data.info.notes, $(this).val());
//       game.locals[app.attr("id")+"-edit-page"].update();
//
//       if (scope.autoSave) {
//         sync.rawVal(obj.data.info.notes, $(this).val());
//       }
//       else {
//         save.get(0).innerHTML = save.get(0).innerHTML.replace("Save ", "Save*");
//       }
//     });
//   }
//   else if (util.resourceTypes[sync.rawVal(obj.data.info.mode)] && util.resourceTypes[sync.rawVal(obj.data.info.mode)].edit) {
//     util.resourceTypes[sync.rawVal(obj.data.info.mode)].edit(obj, app, scope, content)
//   }
//   else {
//     var saveWrap = $("<div>").appendTo(optionsBar);
//     saveWrap.addClass("flexcolumn flexmiddle lrmargin");
//
//     if (obj.data._t == "p") {
//       var save = genIcon("book", "Finalize").appendTo(saveWrap);
//       save.attr("title", "Finalize Page");
//       save.click(function(){
//         app.attr("from", "ui_editPage");
//         app.attr("ui-name", "ui_renderPage");
//         sync.rawVal(obj.data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//         obj.sync("updateAsset");
//         game.locals[app.attr("id")+"-edit-page"] = null;
//       });
//     }
//
//     var editorWrap = $("<div>").appendTo(content);
//     editorWrap.addClass("");
//
//     var editorContent = $("<textarea>").appendTo(editorWrap);
//     editorContent.attr("id", "adventure-editor-"+app.attr("id"));
//     editorContent.attr("maxlength", "10000");
//     editorContent.attr("placeholder", "");
//     editorContent.val(unpurge(sync.rawVal(info.notes)));
//     editorContent.css("opacity", "0");
//     setTimeout(function(){
//       editorContent.css("opacity", "");
//       tinymce.execCommand('mceRemoveEditor', true, "adventure-editor-"+app.attr("id"));
//       var entNames = [];
//       for (var i in game.entities.data) {
//         var ent = game.entities.data[i];
//         if (hasSecurity(getCookie("UserID"), "Visible", ent.data) && ent.data.info && sync.rawVal(ent.data.info.name) && sync.rawVal(ent.data.info.name).length > 3) {
//           entNames.push({name : sync.rawVal(ent.data.info.name), id : ent.id()});
//         }
//       }
//       tinymce.init({
//         selector : "#adventure-editor-"+app.attr("id"),
//         menubar : false,
//         themes : "custom",
//         skin : "light",
//         plugins : [
//           'advlist autolink textcolor lists link image charmap print preview anchor',
//           'searchreplace visualblocks code fullscreen hr spellchecker',
//           'insertdatetime media contextmenu paste code mention visualblocks placeholder'
//         ],
//         browser_spellcheck : true,
//         mentions : {
//           delimiter : "@",
//           delay : "100",
//           source: entNames,
//           insert: function(item) {
//             return "<a href='|asset|="+item.id+"'>"+item.name+"</a>";
//           }
//         },
//         extended_valid_elements : "div[data]",
//         //toolbar : 'undo redo | insert | styleselect visualblocks | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media ',
//         toolbar : "title subtitle bold italic line | alignleft aligncenter alignright | outdent indent | forecolor backcolor | bullist numlist",
//         contextmenu : "underline strikethrough | link image inserttable fileLink audioLink | assetLink settingLink effectLink combatLink rollTable macroLink | visualblocks",
//         resize : false,
//         height : 50,
//         pagebreak_split_block: true,
//         setup : function(editor) {
//           editor.addButton('title', {
//             text: "H1",
//             tooltip : "Header",
//             onclick: function () {
//               var selection = tinyMCE.get("adventure-editor-"+app.attr("id")).selection.getContent({'format': 'text'});
//               if (selection) {
//                 selection = selection.trim();
//               }
//               tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<h1 style='margin:0; font-size:3.0em; font-weight:bolder;'>"+selection+"</h1><hr class='h1' style='display : block; outline : none; border : none; width : 100%; height : 4px; background : grey; margin-top:0px; margin-bottom:0.5em;'></hr><p></p>");
//             },
//             onpostrender : function() {
//               var btn = $(this.$el[0]).find(".mce-txt");
//               btn.css("font-weight", "bold");
//               btn.css("font-size", "1.2em");
//             }
//           });
//           editor.addButton('subtitle', {
//             text: "H2",
//             tooltip : "Sub Header",
//             onclick: function () {
//               var selection = tinyMCE.get("adventure-editor-"+app.attr("id")).selection.getContent({'format': 'text'});
//               if (selection) {
//                 selection = selection.trim();
//               }
//               tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<h2 style='margin:0; font-size:1.4em; font-weight:bold;'>"+selection+"</h2><hr class='h2' style='display : block; outline : none; border : none; width : 100%; height : 1px; background : grey; margin-top:0px; margin-bottom:0.5em;'></hr><p></p>");
//             },
//             onpostrender : function() {
//               var btn = $(this.$el[0]).find(".mce-txt");
//               btn.css("font-weight", "bold");
//             }
//           });
//
//           editor.addButton('line', {
//             icon : "hr",
//             tooltip : "Horizontal Break",
//             onclick: function () {
//               tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<hr style='display : block; width : 100%; height : 2px; background-color : grey; margin-top:0px; margin-bottom:1em;'></hr>");
//             },
//             onpostrender : function() {
//               var btn = $(this.$el[0]).find(".mce-txt");
//               btn.css("font-weight", "bold");
//             }
//           });
//           editor.addMenuItem('fileLink', {
//             text: "File",
//             onclick: function() {
//               var content = sync.render("ui_filePicker")(obj, app, {allowExternal : true, change : function(ev, ui, val){
//                 tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<img src='"+val+"' width='"+(editorWrap.width()-30)+"'></img>");
//                 layout.coverlay("image-selection");
//               }});
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 prompt : true,
//                 id : "image-selection",
//                 style : {"width" : assetTypes["filePicker"].width, "height" : assetTypes["filePicker"].height}
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('audioLink', {
//             text: "Sound",
//             onclick: function() {
//               var content = sync.render("ui_filePicker")(obj, app, {allowExternal : true, filter : "audio", change : function(ev, ui, val, name){
//                 tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='sound"+val+"'>"+name+"</a>");
//                 layout.coverlay("image-selection");
//               }});
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 prompt : true,
//                 id : "image-selection",
//                 style : {"width" : assetTypes["filePicker"].width, "height" : assetTypes["filePicker"].height}
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('assetLink', {
//             text: "Asset",
//             onclick: function () {
//               var ignore = {};
//               ignore[obj.id()] = true;
//               var content = sync.render("ui_assetPicker")(obj, app, {
//                 rights : "Visible",
//                 ignore : ignore,
//                 select : function(ev, ui, ent, options, entities){
//                   var name = sync.rawVal(ent.data.info.name);
//                   var img = (sync.rawVal(ent.data.info.img) || "/content/icons/blankchar.png");
//                   var id = ent.id();
//                   if (ent.data._t == "p" && sync.rawVal(ent.data.info.mode) == "Roll Table") {
//                     var tableStr = "<table style='width : 100%;'>";
//
//                     var tableData;
//
//                     if (sync.rawVal(ent.data.info.notes) && sync.rawVal(ent.data.info.notes)[0] == "{") {
//                       try {
//                         tableData = JSON.parse(sync.rawVal(ent.data.info.notes));
//                       }
//                       catch (e) {
//                         tableData = {headers : [], contents : []};
//                       }
//                     }
//                     else {
//                       tableData = {headers : [], contents : []};
//                     }
//
//                     tableStr += "<tr>";
//                     for (var i=0; i<tableData.headers.length; i++) {
//                       var contentData = tableData.headers[i];
//
//                       tableStr += "<td>"+(contentData.name || "")+"</td>";
//                     }
//                     tableStr += "</tr>";
//                     for (var i=0; i<tableData.contents.length; i++) {
//                       var contentData = tableData.contents[i];
//
//                       tableStr += "<tr><td>"+(contentData.name || "")+"</td><td>"+(contentData.value || "")+"</td></tr>";
//                     }
//                     tableStr += "</table>";
//
//                     var str = "";
//                     if (sync.rawVal(ent.data.info.name) && sync.rawVal(ent.data.info.name).trim()) {
//                       str += "<h2 style='margin:0; font-size:1.4em; font-weight:bold;'>"+sync.rawVal(ent.data.info.name)+"</h2><hr class='h2' style='display : block; outline : none; border : none; width : 100%; height : 1px; background : grey; margin-top:0px;'></hr>";
//                     }
//                     str += tableStr;
//
//                     tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, str);
//                   }
//                   else {
//                     tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='|asset|="+id+"'>"+(name || id)+"</a>");
//                   }
//
//                   layout.coverlay("add-asset");
//                 }
//               });
//               var pop = ui_popOut({
//                 target : $("body"),
//                 prompt : true,
//                 id : "add-asset",
//                 title : "Add Asset Link...",
//                 style : {"width" : assetTypes["assetPicker"].width, "height" : assetTypes["assetPicker"].height}
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('effectLink', {
//             text: "Special Effects",
//             onclick: function () {
//               var settingObj = sync.obj();
//               settingObj.data = {setting : {}};
//
//               var content = $("<div>");
//               content.addClass("flexcolumn flex flexmiddle foreground");
//
//               for (var key in util.effects) {
//                 var effectButton = $("<button>").appendTo(content);
//                 effectButton.addClass("background alttext");
//                 effectButton.text(key);
//                 effectButton.css("min-width", "200px");
//                 effectButton.click(function(){
//                   tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='effect_"+$(this).text()+"'>"+$(this).text()+"</a>");
//                   layout.coverlay("effect-selection");
//                 });
//               }
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 title : "Special Effects",
//                 id : "effect-selection",
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('settingLink', {
//             text: "Time / Weather / Temp",
//             onclick: function () {
//               var settingObj = sync.obj();
//               settingObj.data = {setting : {}};
//
//               var content = $("<div>");
//               content.addClass("background flexcolumn flex flexmiddle spadding");
//
//               var newApp = sync.newApp("ui_setting").appendTo(content);
//               settingObj.addApp(newApp);
//
//               var button = $("<button>").appendTo(content);
//               button.addClass("fit-x flexmiddle");
//               button.append("Confirm");
//               button.click(function(){
//                 tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='setting"+JSON.stringify(settingObj.data)+"'>"+"Setting"+"</a>");
//                 layout.coverlay("setting-selection");
//               });
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 title : "Time / Weather / Temp",
//                 id : "setting-selection",
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('combatLink', {
//             text: "Combat",
//             onclick: function () {
//               var combatObj = sync.obj();
//               combatObj.data = {combat : {engaged : {}, current : {}}};
//
//               var content = $("<div>");
//               content.addClass("flexcolumn flex");
//
//               var newApp = sync.newApp("ui_turnOrder").appendTo(content);
//               combatObj.addApp(newApp);
//
//               var button = $("<button>").appendTo(content);
//               button.addClass("fit-x flexmiddle");
//               button.append("Confirm");
//               button.click(function(){
//                 tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='combat"+JSON.stringify(combatObj.data)+"'>"+"Combat"+"</a>");
//                 layout.coverlay("combat-selection");
//               });
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 id : "combat-selection",
//                 style : {"width" : "50vw", "height" : "40vh"}
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           editor.addMenuItem('rollTable', {
//             text: "Roll Table",
//             onclick: function () {
//               var ent = sync.obj();
//               ent.data = duplicate(game.templates.page);
//               sync.rawVal(ent.data.info.name, " ");
//               sync.rawVal(ent.data.info.mode, "Roll Table");
//
//               var content = $("<div>");
//               content.addClass("flexcolumn flex");
//
//               var newApp = sync.newApp("ui_editPage").appendTo(content);
//               newApp.attr("entry", "true");
//               newApp.attr("hideOptions", "true");
//               ent.addApp(newApp);
//
//               var button = $("<button>").appendTo(content);
//               button.addClass("fit-x flexmiddle");
//               button.append("Confirm");
//               button.click(function(){
//                 var tableStr = "<table style='width : 100%;'>";
//
//                 var tableData;
//
//                 if (sync.rawVal(ent.data.info.notes) && sync.rawVal(ent.data.info.notes)[0] == "{") {
//                   try {
//                     tableData = JSON.parse(sync.rawVal(ent.data.info.notes));
//                   }
//                   catch (e) {
//                     tableData = {headers : [], contents : []};
//                   }
//                 }
//                 else {
//                   tableData = {headers : [], contents : []};
//                 }
//
//                 tableStr += "<tr>";
//                 for (var i=0; i<tableData.headers.length; i++) {
//                   var contentData = tableData.headers[i];
//
//                   tableStr += "<td>"+(contentData.name || "")+"</td>";
//                 }
//                 tableStr += "</tr>";
//                 for (var i=0; i<tableData.contents.length; i++) {
//                   var contentData = tableData.contents[i];
//
//                   tableStr += "<tr><td>"+(contentData.name || "")+"</td><td>"+(contentData.value || "")+"</td></tr>";
//                 }
//                 tableStr += "</table>";
//                 var str = "";
//                 if (sync.rawVal(ent.data.info.name) && sync.rawVal(ent.data.info.name).trim()) {
//                   str += "<h2 style='margin:0; font-size:1.4em; font-weight:bold;'>"+sync.rawVal(ent.data.info.name)+"</h2><hr class='h2' style='display : block; outline : none; border : none; width : 100%; height : 1px; background : grey; margin-top:0px;'></hr>";
//                 }
//                 str += tableStr;
//
//                 tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, str);
//                 layout.coverlay("combat-selection");
//               });
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 id : "combat-selection",
//                 style : {"width" : "50vw", "height" : "40vh"}
//               }, content);
//               pop.resizable();
//             }
//           });
//
//           /*editor.addMenuItem('condLink', {
//             text: "Conditional Section",
//             onclick: function () {
//               var content = $("<div>");
//               content.addClass("flexcolumn");
//               content.append("<i class='subtitle fit-x flexmiddle'>Selection will be affected</i>");
//
//               var button = $("<button>").appendTo(content);
//               button.addClass("subtitle");
//               button.append("GM Only");
//
//               var input = $("<textarea>").appendTo(content);
//               input.addClass("subtitle");
//
//               button.click(function(){
//                 input.val("@:gm()");
//               });
//
//               var button = $("<button>").appendTo(content);
//               button.append("Confirm");
//               button.click(function(){
//                 var text = tinyMCE.get("adventure-editor-"+app.attr("id")).selection.getContent({'format': 'html'});
//                 if (text && text.length > 0) {
//                   tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, '<div data="'+input.val()+'">'+text+'</div>');
//                 }
//                 layout.coverlay("cond-selection");
//               });
//
//               var pop = ui_popOut({
//                 target : editorWrap,
//                 id : "cond-selection",
//               }, content);
//             }
//           });*/
//
//           editor.addMenuItem('macroLink', {
//             text: "Roll Equation",
//             onclick: function () {
//               var pop = ui_prompt({
//                 target : editorWrap,
//                 id : "macro-selection",
//                 inputs : {
//                   "Equation" : ""
//                 },
//                 click : function(ev, inputs) {
//                   if (inputs["Equation"].val()) {
//                     tinyMCE.get("adventure-editor-"+app.attr("id")).execCommand('mceInsertContent', false, "<a href='macro'>"+inputs["Equation"].val()+"</a>");
//                   }
//                   layout.coverlay("macro-selection");
//                 }
//               });
//             }
//           });
//         },
//         init_instance_callback : function(editor) {
//           var delay = 1;
//           if (isChrome()) {
//             delay = 0;
//           }
//           setTimeout(function(){
//             var part = $(editor.editorContainer);
//             var height = $("#"+editor.editorContainer.id).height() - $(editor.contentAreaContainer).height();
//             editor.theme.resizeTo("100%", content.height()-height-4);
//           }, delay);
//
//           var save = genIcon("floppy-disk", "Save ");
//           save.appendTo(saveWrap);
//           save.attr("title", "Save Changes");
//           save.click(function(){
//             if (app.attr("targetApp")) {
//               $("#"+app.attr("targetApp")).removeAttr("viewingNotes");
//             }
//             save.text("Save");
//             sync.rawVal(obj.data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//             obj.sync("updateAsset");
//             game.locals[app.attr("id")+"-edit-page"] = game.locals[app.attr("id")+"-edit-page"] || sync.obj();
//             game.locals[app.attr("id")+"-edit-page"].data = duplicate(obj.data);
//             if (app.attr("saveClose")) {
//               layout.coverlay(app.attr("saveClose"));
//             }
//           });
//           editor.on('Change', function(ev) {
//             sync.rawVal(game.locals[app.attr("id")+"-edit-page"].data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//             game.locals[app.attr("id")+"-edit-page"].update();
//
//             if (scope.autoSave) {
//               sync.rawVal(obj.data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//             }
//             else {
//               save.get(0).innerHTML = save.get(0).innerHTML.replace("Save ", "Save*");
//             }
//           });
//           editor.on("keyup", function(){
//             sync.rawVal(game.locals[app.attr("id")+"-edit-page"].data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//             game.locals[app.attr("id")+"-edit-page"].update();
//
//             if (scope.autoSave) {
//               sync.rawVal(obj.data.info.notes, tinyMCE.get("adventure-editor-"+app.attr("id")).getContent({format : 'raw'}));
//             }
//             else {
//               save.get(0).innerHTML = save.get(0).innerHTML.replace("Save ", "Save*");
//             }
//           });
//         }
//       });
//     }, 0);
//   }
//   if (scope.hideOptions) {
//     optionsBar.hide();
//   }
//   if (scope.entry) {
//     optionsBar.empty();
//
//     var title = genInput({
//       parent : optionsBar,
//       classes : "line smargin",
//       title : "Change this page's name",
//       value : sync.rawVal(obj.data.info.name),
//     });
//     title.attr("title", "Change this page's Name");
//     title.change(function(){
//       sync.rawVal(obj.data.info.name, $(this).val());
//       obj.sync("updateAsset");
//     });
//   }
//
//   return div;
// });