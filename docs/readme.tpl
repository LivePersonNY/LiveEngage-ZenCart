Installation instructions
1.  Unzip the zip file
2.  Rename YOUR_ADMIN to your custom admin folder name
3.  Upload the files to your zenCart directory
4.  Go to Configuration > LivePerson LiveEngage
5.  Enter your account number and select to enable the chat widget
6.  Clear your site cache

Uninstall instructions
1.  Remove the files from your site:
    <% _.forEach(FILES, function(file, index) { %>* <%- file + ((index != FILES.length - 1) ? "\n\t" : "") %><% }); %>
2.  Create a backup of your database ( see: https://www.zen-cart.com/content.php?144 )
3.  Navigate to Tools > Install SQL Patches
4.  Copy the contents of uninstall.sql into the text box or upload the file
