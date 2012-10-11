/**
 * Dialog helpers for alert/confirm, managing their own jQueryUI L&F dialogs
 * @todo language
 * @todo options?
 * @author martijn@crmmailtech.nl
 */

(function( $ ){
	jQuery.alert = function(text, callback) {
		var div = '<div><p><span class="ui-icon ui-icon-info" style="float:left; margin:0 7px 20px 0;"></span>'+text+'</p></div>';
		$(div).prependTo('body').dialog({
			resizable:	false,
			title:		'Alert',
			modal:		true,
			close:		function(event, ui) {
							$(this).remove();
							if (typeof callback !== 'undefined') {
								callback();
							}
						},
			buttons: {
				'OK': function() {
					$(this).dialog('close');
				}
			}
		});
	}

	/**
	 * Displays a confirmation dialog.
	 * Callback returns true (on OK), false (on Cancel) or undefined (on escape key/close window button)
	 */
	jQuery.confirm = function(text, callback) {
		var div = '<div><p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>'+text+'</p></div>';
		$(div).prependTo('body').dialog({
			resizable:	false,
			title:		'Confirm',
			modal:		true,
			close:		function(event, ui) {
							$(this).remove();
							if (typeof callback !== 'undefined') {
								callback(this.result);
							}
						},
			buttons: {
				'OK': function() {
					this.result = true;
					$(this).dialog('close');
				},
				'Cancel': function() {
					this.result = false;
					$(this).dialog('close');
				}
			}
		});
	}
})( jQuery );