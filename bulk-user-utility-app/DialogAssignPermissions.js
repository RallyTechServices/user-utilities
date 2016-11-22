Ext.define('CA.technicalservices.userutilities.dialog.AssignProjectPermissions', {
    extend: 'CA.technicalservices.userutilities.dialog.ProjectPermissions',

    title: 'Project Permissions',
    goText: "Assign",


    _getColumnCfgs: function(){

        return [{
            xtype: 'treecolumn',
            text: 'Project',
            menuDisabled: true,
            dataIndex: 'Name',
            flex: 1
        },{
            text: 'Viewer',
            dataIndex: '__permissionViewer',
            align: 'center',
            renderer: function(v,m,r){
                var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                return tpl.apply(v);
            }
        },{
            text: 'Editor',
            dataIndex: '__permissionEditor',
            align: 'center',
            renderer: function(v,m,r){
                var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                return tpl.apply(v);
            }
        },{
            text: 'Admin',
            dataIndex: '__permissionAdmin',
            align: 'center',
            renderer: function(v,m,r){
                var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                return tpl.apply(v);
            }
        }];
    }

});