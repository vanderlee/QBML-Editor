/*jslint devel: true, bitwise: true, regexp: true, browser: true, confusion: true, unparam: true, eqeq: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals jQuery, $ */

/*
 * Support functions - no jQuery
 */

function escape(text) {
	'use strict';

	var replace = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]],
		item;
	for (item = 0; item < replace.length; item++) {
		text = text.replace(replace[item][0], replace[item][1]);
	}
	return text;
}

/**
 * Does dumb hyphenation.
 * This is wrong more often than right, but it's good enough for it's purpose.
 */
function hyphenateWord(word, max, chop, hyphen) {
	'use strict';

	var c,
		parts = [],
		part = '';

	if (word.length > max) {
		for (c = 0; c < word.length; ++c) {
			part = part + word[c];

			if (part.length >= chop
			 || (part.length >= 2 && /[aeiou]/i.test(word[c]))) {
				parts.push(part);
				part = '';
			}
		}
		if (parts[parts.length - 1].length < chop) {
			parts[parts.length - 1] += part;
		} else {
			parts.push(part);
		}

		word = parts.join(hyphen);
	}

	return word;
}

function hyphenate(text, _max, _chop, _hyphen) {
	'use strict';

	var max		= _max || 8,
		chop	= _chop || 6,
		hyphen	= _hyphen || '&shy;',
		parts	= text.match(/[a-z]+|[^a-z]+/ig),
		p;

	if (parts) {
		for (p = 0; p < parts.length; ++p) {
			if (/[a-z]+/ig.test(parts[p])) {
				parts[p] = hyphenateWord(parts[p], max, chop, hyphen);
			}
		}

		return parts.join('');
	}
	return text;

}

/*
 * Core
 */

var SORTABLE_OPTIONS = {
	handle:					'.handle:first',
	placeholder:			'placeholder',
	forcePlaceholderSize:	true,
	stop:					'updateQBML'
};

function addOption(question, tree_option) {
	'use strict';

	var c = (tree_option && tree_option.c && (tree_option.c == true) ? ' checked="checked"' : ''),
		d = escape(tree_option && tree_option.d ? tree_option.d : ''),
		e = escape(tree_option && tree_option.e ? tree_option.e : ''),
		html = '',
		option;

	html += '<div class="option">';
	html +=		'<div class="handle ui-widget-header ui-corner-all"><span class="correct-state">Fout</span>Optie <span class="hint">'+hyphenate(d)+'</span></div>';
	html +=		'<div class="content">';
	html +=			'<button class="delete">Verwijderen</button>';
	html +=			'Correct? <input type="checkbox" class="correct"'+c+'/> &nbsp;';
	html +=			'<div class="field"><label>Omschrijving:</label> <textarea placeholder="Vul een mogelijk antwoord in&hellip;" class="description" rows="1">'+d+'</textarea></div>';
	html +=			'<br/><div class="field"><label>Uitleg:</label> <textarea placeholder="Leg uit waarom de vraag goed of fout is&hellip;" class="explanation" rows="1">'+e+'</textarea></div>';
	html +=		'</div>';
	html += '</div>';

	option = $(html).appendTo($('.options', question));

	$('button', option).button();
	$('textarea', option).tabby().autosize();
}

function addQuestion(tree_question) {
	'use strict';

	var d = escape(tree_question && tree_question.d ? tree_question.d : ''),
		html = '',
		question;

	html += '<div class="question">';
	html +=		'<div class="handle ui-widget-header ui-corner-all"><span class="correct-count">0</span>Vraag <span class="hint">'+hyphenate(d)+'</span></div>';
	html +=		'<div class="content">';
	html +=			'<button class="delete">Verwijderen</button>';
	html +=			'Omschrijving: <input type="text" class="description" value="'+d+'" placeholder="Vul hier de vraag in&hellip;"/>';
	html +=			'<div class="options"></div>';
	html +=			'<button class="add_option">Optie toevoegen</button>';
	html +=		'</div>';
	html += '</div>';

	question = $(html).appendTo('#questionbank');

	$('button', question).button();
	$('textarea', question).tabby().autosize();
	$('.options', question).sortable(SORTABLE_OPTIONS);

	if (tree_question && tree_question.o) {
		$.each(tree_question.o, function(index, tree_option) {
			addOption(question, tree_option);
		});
	} else {
		addOption(question);
	}
}

function deleteQuestionCookies() {
	'use strict';

	var cookies = document.cookie.split(';'),
		c,
		key;
	for (c = 0; c < cookies.length; ++c) {
		key = cookies[c].match(/question\d+/);
		if (key !== null) {
			$.cookie(key, null);
		}
	}
}

/**
 * Write QBML, Set Cookies, Update DOM... the name is somewhat misleading.
 */
function updateQBML() {
	'use strict';

	var qbml = '',
		question_count = 0,
		studentname = $('#studentname').val() || 'John Doe',
		studentnumber = $('#studentnumber').val() || '1234567',
		index;

	qbml += '<!-- ' + studentname + ' ' + studentnumber + ' -->\n';
	$.cookie('studentname', studentname, { expires: 99999 });
	$.cookie('studentnumber', studentnumber, { expires: 99999 });

	qbml += '<questionbank>\n';

	$('#questionbank .question').each( function() {
		var options = '',
			d,
			e;

		$('.option', this).each( function() {
			if ((d = $('.description', this).val()) !== '') {
				options += '\t\t<option correct="'+($('.correct', this).is(':checked')? 'true' : 'false')+'">\n';
				options += '\t\t\t<description><![CDATA['+d+']]></description>\n';
				if ((e = $('.explanation', this).val()) !== '') {
					options += '\t\t\t<explanation><![CDATA['+e+']]></explanation>\n';
				}
				options += '\t\t</option>\n';
			}
		});

		if (options !== '' && (d = $('.description', this).val()) !== '') {
			qbml += '\t<question id="'+(++question_count)+'">\n';
			qbml += '\t\t<description><![CDATA['+d+']]></description>\n';
			qbml += options;
			qbml += '\t</question>\n';
		}
	});

	qbml += '</questionbank>';

	$('#qbml').text(qbml);

	// cookies for persistance
	deleteQuestionCookies();

	index = 0;
	$('#questionbank .question').each( function() {
		var question = { o: []	},
			d = $('.description', this).first().val();

		if (d != '') {
			question.d = d;
		}

		$('.option', this).each( function() {
			var option = {},
				correct = $('.correct', this).is(':checked'),
				description = $('.description', this).first().val(),
				explanation = $('.explanation', this).first().val();

			if (correct)			{	option.c = correct;	}
			if (description != '')	{	option.d = description;	}
			if (explanation != '')	{	option.e = explanation;	}

			question.o.push(option);
		});

		$.cookie('question'+(++index), $.toJSON(question), { expires: 99999 });
	});

	// question-count
	$('.question_count').text(index);

	// correct-count
	$('.question').each(function() {
		var options = $('.option', this).length,
			correct = $('.correct:checked', this).length;

		$('.correct-count', this).text(correct + '/' + options)[correct == 0 || correct >= options? 'addClass' : 'removeClass']('error');
	});

	// correct-state
	$('.option').each(function() {
		var correct = $('.correct', this).is(':checked');
		$('.correct-state', this).text(correct ? 'Goed' : 'Fout')[correct ? 'removeClass' : 'addClass']('error');
	});
}

function parseQBML(qbml) {
	'use strict';

	var tree = [],
		$qbml = $($.parseXML(qbml)),
		matches = $.trim($qbml.comments().text()).match(/^(.*)\s+(\d*)$/);
	$('#studentname').val(matches[1]);
	$('#studentnumber').val(matches[2]);

	$qbml.find('question').each( function() {
		var question = {
			d: $('description', this).first().text()
		,	o: []
		};

		$('option', this).each( function() {
			var option = {
				c: $(this).attr('correct') == 'true'
			,	d: $('description', this).text()
			,	e: $('explanation', this).text()
			};

			question.o.push(option);
		});

		tree.push(question);
	});

	return tree;
}

function addTree(tree) {
	'use strict';

	$.each(tree, function(index, question) {
		addQuestion(question);
	});
}

function addQBML(qbml) {
	'use strict';

	try {
		addTree(parseQBML(qbml));
	} catch(e) {
		$.alert('Geen geldige qbml.');
	}
}

/*
 * Mainline
 */

$(function() {
	'use strict';

	$('#switcher').themeswitcher();

	$('#studentname').val($.cookie('studentname'));
	$('#studentnumber').val($.cookie('studentnumber'));

	var index = 0,
		question = '',
		tree = [];

	while ((question = $.evalJSON($.cookie('question'+(++index))))) {
		tree.push(question);
	}

	if (tree.length > 0) {
		addTree(tree);
	} else {
		addQuestion();
	}
	updateQBML();

	$('button').button();

	$('#questionbank').sortable(SORTABLE_OPTIONS);

	$('.parse_qbml_replace').click( function() {
		$.confirm('Zeker weten dat je alles wil vervangen?', function(confirm) {
			if (confirm) {
				$('#questionbank').empty();
				addQBML($('#qbml').val());
				updateQBML();
			}
		});
	});

	$('.parse_qbml_append').click( function() {
		addQBML($('#qbml').val());
		updateQBML();
	});

	$('.clear').click( function() {
		$.confirm('Zeker weten dat je alles wil wissen?', function(confirm) {
			if (confirm) {
				$('#questionbank').empty();
				addQuestion();
				updateQBML();
			}
		});
	});

	$('.hide_all').click( function() {
		$('.content').hide();
	});

	$('.show_all').click( function() {
		$('.content').show();
	});

	$('.add_question').click( function() {
		addQuestion();
		updateQBML();
	});

	$('#questionbank').on('click', '.delete', function() {
		var that = this;
		$.confirm('Zeker weten dat je wil verwijderen?', function(confirm) {
			if (confirm) {
				$(that).closest('.question,.option').remove();
				updateQBML();
			}
		});
	});

	$('#questionbank').on('click', '.add_option', function() {
		addOption($(this).closest('.question'));
		updateQBML();
	});

	$('#questionbank').on('click', '.handle', function() {
		$(this).siblings('.content').toggle();
	});

	// dubbelle dosis events, wat boeit? (IE waarschijnlijk, maar wie gebruikt dat nog?)
	$('#questionbank').on('keydown keyup change', 'input,textarea', updateQBML);
	$('#questionbank').on('keydown keyup', '.description', function() {
		$(this).closest('.question,.option').find('.hint').first().html(hyphenate($(this).val()));
	});
	$('#studentname,#studentnumber').on('keydown keyup change', updateQBML);

	// Initial only; collapse all options
	$('.option .content').hide();
});