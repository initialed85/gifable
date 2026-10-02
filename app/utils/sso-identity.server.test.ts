import { getAllowedSsoEmail } from "./sso-identity.server";

describe("getAllowedSsoEmail", () => {
  const allowedEmails = [
    "edward.beech@ftpsolutions.com.au",
    "daniel.leone@ftpsolutions.com.au",
  ];

  it("returns a normalized email when it is allowlisted", () => {
    const request = new Request("https://gifable.example/", {
      headers: { "X-Forwarded-Email": " Daniel.Leone@FTPSolutions.com.au " },
    });

    expect(getAllowedSsoEmail(request, allowedEmails)).toBe(
      "daniel.leone@ftpsolutions.com.au"
    );
  });

  it("rejects missing and non-allowlisted identities", () => {
    const missing = new Request("https://gifable.example/");
    const unlisted = new Request("https://gifable.example/", {
      headers: { "X-Forwarded-Email": "outsider@ftpsolutions.com.au" },
    });

    expect(getAllowedSsoEmail(missing, allowedEmails)).toBeNull();
    expect(getAllowedSsoEmail(unlisted, allowedEmails)).toBeNull();
  });
});
