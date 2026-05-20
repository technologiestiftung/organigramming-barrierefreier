// Custom behaviour and functionality for the dataset search form at `/datensaetze`

(function (Drupal, drupalSettings) {
  Drupal.behaviors.myModuleBehavior = {
    attach: function (context, settings) {

jQuery(document).ready(function ($) {

    var tagify;

    $('#fulltext-search').submit(function (e) {
      e.preventDefault();
      submit_form();
    });

    $('#facetted-search').submit(function (e) {
      e.preventDefault();
      submit_form();
    });

    $("#field-order-by").on("change", function () {
      submit_form();
    });

    function submit_form() {

      var search = new URLSearchParams();

      let fulltext_search_form = document.getElementById('fulltext-search');
      let fulltext_search_form_data = new FormData(fulltext_search_form);

      // delete q if it doesn't have a value
      var q = fulltext_search_form_data.get('q').trim();
      if (q) {
        search.append('q', q);
      }

      let facetted_search_form = document.getElementById('facetted-search');

      // get the values of the facet checkboxes and turn them into the correct URL parameters
      $('.facets .form-check-input:checked').each(function (index) {
        let facet_name = $(this).data("facetname");
        let facet_value = $(this).data("facetvalue");
        search.append(facet_name, facet_value);
      });

      // remove all tags from the search string
      // re-add the current tags to the search string
      tagify.value.forEach(function (tag) {
        // search.append("tags", encodeURIComponent(tag.value));
        search.append("tags", tag.value);
      });

      // append sorting parameter
      var valueSelected = $("#field-order-by").val();
      if (valueSelected) {
        search.append("sort", valueSelected);
      }

      if (search.size === 0) {
        window.location = window.location.href.split("?")[0];
      } else {
        window.location.search = search;
      }
    }

    // Handle entry of tags with autocompletion

    // intialize tagify

    // transform the response from CKAN's tag/autocomplete API to an array of strings
    function tagArrayFromCkanResponse(_response) {
      return _response.result.map(function (value, key, array) { return value; });
    }

    tag_input = $('input[name=dataset_tags]').each(function (index) {
      tagify = new Tagify(this, {
        enforceWhitelist: true,
        position: "input",
        enabled: 0,

        // make an array from the initial input value
        whitelist: this.value.trim().split(/\s*,\s*/)
      })

      // Chainable event listeners
      tagify.on('add', onAddTag)
        .on('remove', onRemoveTag)
        .on('input', onInput);

      // callback for tag successfully added
      function onAddTag(e) {
        tagify.off('add', onAddTag);
        $('#facetted-search').submit();
      }

      // callback for tag successfully removed
      function onRemoveTag(e) {
        tagify.off('remove', onRemoveTag);
        $('#facetted-search').submit();
      }

      // on character(s) added/removed (user is typing/deleting)
      function onInput(e) {
        // console.log("onInput: ", e.detail);
        tagify.settings.whitelist.length = 0; // reset current whitelist
        tagify.loading(true).dropdown.hide.call(tagify) // show the loader animation

        // get new whitelist from a delayed mocked request (Promise)
        let datenregister_uri = drupalSettings.data_tunnel.datenregister_uri;
        $.get(datenregister_uri + "/api/3/action/tag_autocomplete",
        { q: e.detail.value })
        .then(function (result) {
          result = tagArrayFromCkanResponse(result);
          // replace tagify "whitelist" array values with new values
          // and add back the ones already choses as Tags
          tagify.settings.whitelist.push(...result, ...tagify.value)

          // render the suggestions dropdown.
          tagify.loading(false).dropdown.show.call(tagify, e.detail.value);
        })
      }


    });
});

    }
  };
})(Drupal, drupalSettings);