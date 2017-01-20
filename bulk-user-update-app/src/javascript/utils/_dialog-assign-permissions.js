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
            renderer: this.toggleRenderer
        },{
            text: 'Editor',
            dataIndex: '__permissionEditor',
            align: 'center',
            renderer: this.toggleRenderer
        },{
            text: 'Admin',
            dataIndex: '__permissionAdmin',
            align: 'center',
            renderer: this.toggleRenderer
        }];
    }

});