Ext.define('CA.technicalservices.userutilities.dialog.RemovePermissions', {
    extend: 'CA.technicalservices.userutilities.dialog.ProjectPermissions',

    title: 'Remove Project Permissions',
    goText: 'Remove',

    _getColumnCfgs: function(){

        return [{
            xtype: 'treecolumn',
            text: 'Project',
            menuDisabled: true,
            dataIndex: 'Name',
            flex: 1
        },{
            text: 'Remove Access',
            dataIndex: '__permissionNone',
            align: 'center',
            renderer: this.toggleRenderer
        }];
    }

});