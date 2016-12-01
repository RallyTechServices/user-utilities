Ext.define('CA.technicalservices.userutilities.dialog.TeamMembership', {
    extend: 'CA.technicalservices.userutilities.dialog.ProjectPermissions',

    title: 'Assign Team Membership',
    goText: 'Assign',

    _getColumnCfgs: function(){

        return [{
            xtype: 'treecolumn',
            text: 'Project',
            menuDisabled: true,
            dataIndex: 'Name',
            flex: 1
        },{
            text: 'Team Member',
            dataIndex: '__teamMember',
            align: 'center',
            renderer: function (v, m, r) {
                var tpl = Ext.create('Rally.ui.renderer.template.ToggleButtonTemplate');
                return tpl.apply(v);
            }
        }];
    }

});