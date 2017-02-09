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
            model: 'User',
            pageSize: 200,
            fetch: ['WorkspacePermission','UserName','DisplayName']
        },
        enableBulkEdit: true,
        bulkEditConfig: {
            items: [{
                xtype: 'assignpermissionsbulkmenuitem',
            },{
                xtype: 'removepermissionsbulkmenuitem'
            },{
                xtype: 'teammembershipbulkmenuitem'
            }]
        },
        rowActionColumnConfig: {
            rowActionsFn: function (record) {
                return [
                    {
                        xtype: 'rallyrecordmenuitemedit',
                        record: record
                    },
                    {
                        xtype: 'viewpermissionsrecordmenuitem',
                        record: record,
                        listeners: {
                            showprojectpermissions: function(){
                                this.fireEvent('showprojectpermissions');
                            },
                            scope: this
                        }
                    }
                ];
            }
        },
        showPagingToolbar: true,
        pagingToolbarCfg: {
            pageSizes: [25, 50, 100, 200]
        }
    },

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent(arguments);
    },
    initComponent: function(config) {
        this.callParent(arguments);
    }
});

