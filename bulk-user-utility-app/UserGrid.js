Ext.override(Rally.ui.grid.CheckboxModel, {
    _recordIsSelectable: function(record) {
        return record.get('_type') === "user";
    }
});

Ext.define('CA.technicalservices.userutilities.UserGrid',{
    extend: 'Rally.ui.grid.Grid',

    config: {
        columnCfgs: [
            'UserName',
            'DisplayName'
        ],
        margin: 10,
        storeConfig: {
            model: 'User'
        },
        enableBulkEdit: true,
        bulkEditConfig: {
            items: [{
                xtype: 'assignpermissionsbulkmenuitem'
            }]
        }
    },
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent(arguments);
    }
});

