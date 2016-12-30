Ext.define('CA.technicalservices.userutilities.recordmenu.ViewPermissions', {
    extend: 'Rally.ui.menu.item.RecordMenuItem',
    alias: 'widget.viewpermissionsrecordmenuitem',

    clickHideDelay: 1,

    config: {

        /**
         * @cfg {Rally.data.wsapi.Model}
         * The record of the menu
         */
        record: undefined,

        /**
         * @cfg {Function}
         * This is called when a menu item is clicked
         */
        handler: function () {
            var dialogWidth = 600,
                width = Rally.getApp().getWidth(),
                height = Rally.getApp().getHeight();



            if (Rally.getApp().permissionsPanel){
                Rally.getApp().permissionsPanel.destroy();
            }
            Rally.getApp().permissionsPanel = Ext.create('CA.technicalservices.userutilities.ViewPermissionsPanel',{
                width: dialogWidth,
                height: height,
                x: width - dialogWidth,
                record: this.record
            });
        },

        /**
         * @cfg {Function}
         *
         * A function that should return true if this menu item should show.
         * @param record {Rally.data.wsapi.Model}
         * @return {Boolean}
         */
        predicate: function (record) {
            return true;
        },

        /**
         * @cfg {String}
         * The display string
         */
        text: 'View Project Permissions...'

    },
    constructor:function (config) {
        this.initConfig(config);
        this.callParent(arguments);
    }
});
