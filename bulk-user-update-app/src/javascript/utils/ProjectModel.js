Ext.define('CA.technicalservices.userutilities.ProjectModel',{
    extend: 'Ext.data.TreeModel',

    fields: [
        {name: 'Name',  type: 'string'},
        {name: 'ObjectID',   type: 'int'},
        {name: 'Path', type: 'string'},
        {name: '_ref', type: 'string'},
        {name: 'Parent', type: 'auto'},
        {name: '__permissionAdmin', type: 'boolean', defaultValue: false},
        {name: '__permissionEditor', type: 'boolean', defaultValue: false},
        {name: '__permissionViewer', type: 'boolean', defaultValue: false},
        {name: '__permissionNone', type: 'boolean', defaultValue: false},
        {name: '__teamMember', type: 'boolean', defaultValue: false}
    ]
});
