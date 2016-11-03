Ext.define('CA.technicalservices.userutilities.bulkmenu.AssignPermissions', {
    alias: 'widget.assignpermissionsbulkmenuitem',
    extend: 'Rally.ui.menu.bulk.MenuItem',

    config: {
        onBeforeAction: function(){
//            console.log('onbeforeaction');
        },

        /**
         * @cfg {Function} onActionComplete a function called when the specified menu item action has completed
         * @param Rally.data.wsapi.Model[] onActionComplete.successfulRecords any successfully modified records
         * @param Rally.data.wsapi.Model[] onActionComplete.unsuccessfulRecords any records which failed to be updated
         */
        onActionComplete: function(){
            console.log('onActionComplete');
        },

        text: 'Assign Permissions...',

        handler: function () {
            console.log('example menu item clicked');
        },
        predicate: function (records) {
            return _.every(records, function (record) {
                return record;
            });
        }
    }
});