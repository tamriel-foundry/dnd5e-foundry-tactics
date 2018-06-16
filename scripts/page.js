
//
// sync.render("ui_editPage", function (obj, app, scope) {
//     return render_page_edit(obj, app, scope);
// });
//
//
//
// function render_page_edit(obj, app, scope) {
//
//     // Establish default request scope
//     var scope = scope || {
//         viewOnly: (app.attr("viewOnly") == "true"),
//         autoSave : app.attr("autoSave") == "true",
//         entry : app.attr("entry") == "true",
//         hideOptions : app.attr("hideOptions") == "true"
//     };
//
//     // Register a local reference to a working copy of the data
//     var work_id = app.attr("id")+"-edit-page";
//     game.locals[work_id] = game.locals[work_id] || sync.obj();
//     game.locals[work_id].data = duplicate(obj.data);
//
//     // Create edit page
//     var html = $('<section class="page-edit alttext background flexrow flexbetween"></section>');
//     var head = $('<header class="page-edit-header"></header>');
//     html.appendChild(head);
//
//     // Page title
//     var title = genInput({
//       parent : head,
//       classes : "line",
//       title : "Change this page's name",
//       value : sync.rawVal(obj.data.info.name),
//     });
//     title.attr("title", "Change Page Name");
//     title.change(function(){
//       sync.rawVal(obj.data.info.name, $(this).val());
//       obj.sync("updateAsset");
//     });
//
//     console.log(html);
//     return html;
// }