from master_apps.vendor.branch_models import BranchState, BranchCity, VendorBranch

print("Seeding India branch master data...")

# ===============================
# STATE → CITY → SAMPLE BRANCHES
# ===============================

DATA = {
    "Maharashtra": {
        "Pune": ["Hinjewadi", "Baner", "Magarpatta"],
        "Mumbai": ["Andheri", "BKC", "Powai"],
        "Nashik": ["Satpur", "CIDCO"]
    },
    "Karnataka": {
        "Bangalore": ["Whitefield", "Electronic City", "BTM"],
        "Mysore": ["Hebbal Industrial", "Metagalli"]
    },
    "Tamil Nadu": {
        "Chennai": ["Guindy", "OMR", "Ambattur"],
        "Coimbatore": ["Peelamedu", "Saravanampatti"]
    },
    "Delhi": {
        "New Delhi": ["Connaught Place", "Okhla", "Dwarka"]
    },
    "Telangana": {
        "Hyderabad": ["Hitech City", "Gachibowli", "Madhapur"]
    },
    "Gujarat": {
        "Ahmedabad": ["SG Highway", "GIFT City"],
        "Surat": ["Udhna", "Sachin"]
    },
    "Uttar Pradesh": {
        "Noida": ["Sector 62", "Sector 125"],
        "Lucknow": ["Gomti Nagar", "Hazratganj"]
    },
    "Rajasthan": {
        "Jaipur": ["Malviya Nagar", "Sitapura"],
        "Udaipur": ["RIICO Industrial Area"]
    },
    "Madhya Pradesh": {
        "Indore": ["Vijay Nagar", "Pithampur"],
        "Bhopal": ["MP Nagar", "Govindpura"]
    },
    "West Bengal": {
        "Kolkata": ["Salt Lake", "New Town"]
    },
    "Punjab": {
        "Ludhiana": ["Focal Point"],
        "Amritsar": ["Ranjit Avenue"]
    },
    "Haryana": {
        "Gurgaon": ["Cyber City", "Sohna Road"],
        "Faridabad": ["Ballabhgarh"]
    },
    "Kerala": {
        "Kochi": ["Infopark", "Kakkanad"],
        "Trivandrum": ["Technopark"]
    },
    "Andhra Pradesh": {
        "Visakhapatnam": ["MVP Colony", "Gajuwaka"]
    },
    "Odisha": {
        "Bhubaneswar": ["Patia", "Mancheswar"]
    },
    "Chhattisgarh": {
        "Raipur": ["Pandri", "Tatibandh"]
    },
    "Jharkhand": {
        "Ranchi": ["Hatia", "Doranda"]
    },
    "Assam": {
        "Guwahati": ["GS Road", "Dispur"]
    },
    "Bihar": {
        "Patna": ["Kankarbagh", "Boring Road"]
    }
}

# ===============================
# INSERT MASTER DATA
# ===============================

for state_name, cities in DATA.items():

    state_obj, _ = BranchState.objects.get_or_create(name=state_name)

    for city_name, branches in cities.items():

        city_obj, _ = BranchCity.objects.get_or_create(
            name=city_name,
            state=state_obj
        )

        for branch in branches:
            VendorBranch.objects.get_or_create(
                address=branch,
                city=city_obj
            )

print("India branch master data seeded successfully.")