Ext.define('CA.technicalservices.userutilities.ProjectGrid',{
    extend: 'Ext.tree.Panel',

    cls: 'rally-grid',

    padding: 25,

    rootVisible: false,

    columns: [],

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent(arguments);
    }
});