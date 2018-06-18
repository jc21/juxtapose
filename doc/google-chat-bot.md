# Google Chat Bot Instructions

In order to use the new Google Chat bot with Juxtapose, you have to jump through a few hoops.

Follow these instructions in order:

1. Open the [Google Developer Console](https://console.cloud.google.com/apis/dashboard)
2. Create a new Project, the name isn't important
3. Enable the "Hangouts Chat API"
   1. [Manage the API](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   2. Change the Bot Status to Live
   3. Name the Bot as you would like to see in Google Chat
   4. Suggested Avatar URL: https://public.jc21.com/juxtapose/icons/default.png
   5. Any description
   6. Select "Bot works in direct messages" at the very least
   7. Enter a placeholder in the Bot URL field: https://example.com - we will come back and fill this in later
   8. Copy the Verification Token
   9. Save Changes
4. Create a Service Account
    1. Open the [Google Developer Console](https://console.cloud.google.com/apis/dashboard)
    2. Choose [IAM & Admin > Service acounts](https://console.cloud.google.com/iam-admin/serviceaccounts) for your Project you created earlier
    3. Click Create service account
    4. Name it, leave Role blank
    5. Choose Furnish a new Private key
    6. Choose JSON
    7. Click Create/Save
    8. The private key will be downloaded
        1. The ID of this private key will also appear in APIs & services > Credentials
        2. This is the only copy of the key. Do not lose it!
5. Create a Juxtapose Google Chat Bot
    1. Enter the verification code you copied earlier
    2. Open the downloaded credentials JSON file an enter the contents in the textarea
    3. Save
    4. View the Endpoint for your new Service, copy the URL
6. Optional but helpful step if your endpoint is SSL enabled
    1. Reconfigure your [Hangouts Chat API settings](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)
    2. Enter the endpoint you copied in to the Bot URL field

Now you're ready to open [Google Chat](https://chat.google.com) and start a conversation
with Juxtapose. You can either start a Direct message or invite Juxtapose bot to a room.

If you configured step 5 correctly, Juxtapose will send a message to you or the room as soon
as you add him/her/it.

Before any users can receive Juxtapose event notifications from any configured rules,
the user must select with DM/Room they want their notifications to go to.
 