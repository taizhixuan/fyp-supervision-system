# Chapter 6: Testing and Evaluation

The purpose of the testing chapter is to demonstrate the reliability, functionality, and quality assurance of the system or solution you developed. It validates that your system works as intended and meets user or project requirements.

---

## 6.1 Unit Testing

- Include the various units and modules of the system that were tested individually to identify potential problems and bugs.
- Show in tables. Examples in following slides.

### 6.1.1 Test Plan (EXAMPLE)

**Table 6.1 Test plan for Admin Module**

| Test Plan |     |         |                                   |            |
| --------- | --- | ------- | --------------------------------- | ---------- |
| Module    | No  | Test ID | Function                          | Test Date  |
| Admin     | 1   | T01     | Manage branches                   | 4.06.2023  |
|           | 2   | T02     | Manage user roles                 | 4.06.2023  |
|           | 3   | T03     | View Calendars (all branches)     | 8.06.2023  |
|           | 4   | T04     | View Inventory (all branches)     | 8.06.2023  |
|           | 5   | T05     | View Notifications (all branches) | 29.06.2023 |
|           | 6   | T06     | View Reports (all branches)       | 30.06.2023 |

### 6.1.2 Test Data (EXAMPLE)

**Table 6.5 Test Data Summary**

| Module | Test Case |                               | Relevant Test Data                              |
| ------ | --------- | ----------------------------- | ----------------------------------------------- |
| Admin  | T01       | Manage branches               | Name, Address, State, Phone Number              |
|        | T02       | Manage user roles             | Username, Password, Email, Role, Branch         |
|        | T03       | View Calendars (all branches) | Appointment detail, date, time, branch          |
|        | T04       | View Inventory (all branches) | Category, Name, Expiry Date, Barcode, Price     |

### 6.1.3 Test Result

#### EXAMPLE 1

**Table 6.6 Test Case 1**

| Test Case   |                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Case   | Test Case ID   | T17                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|             | Description    | Check user login to validate existing users in accordance to user roles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|             | Precondition   | A valid user account is available in the system                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|             | Post Conditions | The pharmacist is successfully logged into the application and has access to the pharmacist-specific features.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Test Script | Test Steps     | 1. Launch the application.<br>2. Enter the valid username for a pharmacist.<br>3. Username: **pharmacist**<br>4. Enter the valid password for the pharmacist.<br>5. Password: **ppass1234**<br>6. Click on the "Login" button.<br>7. Verify that the user is successfully logged in.<br>8. Expected Result: The user is redirected to the pharmacist dashboard.<br>9. Verify that the appropriate pharmacist-related features are available on the dashboard.<br>10. Expected Result: The dashboard should display functionalities such as reports, patient records and calendar. |
|             | Expected Result | User should be able to log in to the respective user dashboard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|             | Actual Results | Successful login to admin, pharmacist, and assistant views                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### EXAMPLE 2

**6.2.1 Make Appointment (TC-APPT-1A)**

**Use Case ID: STUD_UC_1**

| Test Case ID  | TC-APPT-1A     | Test Case Description | Test the Make Appointment in SRM System |             |                                       |      |
| ------------- | -------------- | --------------------- | --------------------------------------- | ----------- | ------------------------------------- | ---- |
| Created By    | Ng Bei Sheng   | Reviewed By           | Ng Bei Sheng                            | Version     | 1.0                                   |      |
| Tester's Name | Ng Bei Sheng   | Date Tested           | June 5, 2023                            | Test Case (Pass/Fail/Not Executed) | Pass |

**Prerequisites:**

| S# | Prerequisites            |
| -- | ------------------------ |
| 1  | Access to Chrome Browser |
| 2  | Valid student account    |
| 3  |                          |

**Test Data:**

| S# | Test Data                                                                       |
| -- | ------------------------------------------------------------------------------- |
| 1  | appointmentTitle = FYP MEETING FOR SRM                                          |
| 2  | appointmentDetails = Hi dr yeoh i would like to make an appointment with you    |
| 3  | receiver = Dr. Yeoh Eng Thiam                                                   |
| 4  | date = 17/5/2023                                                                |
| 5  | startTime = 3.00pm                                                              |
| 6  | endTime = 3.35pm                                                                |

**Test Scenario:** Verify on create an appointment with lecturer

| Step # | Step Details                            | Expected Results                                                              | Actual Results | Pass / Fail / Not executed / Suspended |
| ------ | --------------------------------------- | ----------------------------------------------------------------------------- | -------------- | -------------------------------------- |
| 1      | Navigate to the add appointment section.| Appointment details columns will be showed up                                 | As Expected    | Pass                                   |
| 2      | Enter appointment details.              | Details can be entered.                                                       | As Expected    | Pass                                   |
| 3      | Click Add button                        | Output "Added Successfully" and redirect to View Appointment List             | As Expected    | Pass                                   |

#### EXAMPLE 3

**Table 6.1: Unit Testing for Web App**

|    | Test Case           | Test to execute the test cases                                | Expected Results                                            | Actual Results                                                |
| -- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1  | Database Connection | Verify that MySQL server can be connected to Web Application  | String "Connected" must be displayed in terminal            | Connected successfully with "Connected" string displayed      |
| 2. | Execution of Queries| Verify that queries derived can be executed and data can be sent/retrieved | Database records must be updated in the MySQL server | Some records were not updated due to forbidden SQL statements |
| 3. | Scheduler           | Verify that scheduled task runs on predetermined time         | WaterPlant function executes on preset time                 | WaterPlant function successfully activated at appointed time  |

#### EXAMPLE 4

| Test Case ID    | TC-1                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Objective  | Ensure authorized access to key in pharmaceutical drug information for supplier is allowed                                                            |
| Test Procedure  | 1. Open web homepage<br>2. Sign in to MetaMask<br>3. Click 'Key in Information' link<br>4. Click on 'Supplier' image link                             |
| Test Input      | Supplier MetaMask account id                                                                                                                          |
| Expected output | Web application redirects to 'supplier.html' page                                                                                                     |
| Actual Output   | Access is granted, user is redirected to 'supplier.html' page                                                                                         |
| Evaluation      | Test case successful                                                                                                                                  |

**Table 6.1 Unit Testing for Web Application**

| #  | Test Case                       | Test to execute test cases     | Expected results               | Actual results                              | Evaluation                                                                                                                                                                  |
| -- | ------------------------------- | ------------------------------ | ------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Display webpage                 | Open webpage location          | Webpage is displayed           | Successfully displays webpage               | Test case successful                                                                                                                                                        |
| 2  | Generate ingredients bulk id    | Click on button to generate    | Ingredients bulk id is generated | Successfully generated ingredients bulk id | Test case successful                                                                                                                                                        |
| 3  | Generate drug batch id          | Click on button to generate    | Drug batch id is generated     | Successfully generated drug batch id        | Test case successful                                                                                                                                                        |
| 4  | Generate individual drug id     | Click on button to generate    | Drug id is generated           | Successfully generated drug id              | Test case successful                                                                                                                                                        |
| 5  | Ensure no duplicate ids generated | Click on button to generate  | Regenerate id if duplicate found | Application crash                          | Test case failed. Nature of JavaScript makes calling of function to check whether id exists within a running for loop to generate specified amount of ids difficult         |

---

## 6.2 Integration Testing

After testing the modules individually, the modules are integrated and tested again. The test results are presented below.

### 6.2.1 Integration Testing: Web application

**Table 6.4: Integration Testing 1**

| #  | Test Case                                                  | Units integrated                                          | Test to execute test cases       | Expected results                          | Actual results                                       |
| -- | ---------------------------------------------------------- | --------------------------------------------------------- | -------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| 1  | Homepage Integration with Trace Drug Information page      | 1. Homepage<br>2. Trace Drug Information page             | Click Trace Drug Information link| Redirected to Trace Drug Information page | Trace Drug Information page loaded successfully      |
| 2  | Homepage integration with Key in Drug Information page     | 1. Homepage<br>2. Key in Drug Information page            | Click Key in Drug Information link| Redirected to Key in Drug Information page | Key in Drug Information page loaded successfully    |
| 3  | Key in Drug Information page Integration with Supplier account page | 1. Key in Drug Information page<br>2. Supplier account page | Click Supplier account page link | Redirected to Supplier account page       | Supplier account page loaded successfully            |

---

## 6.3 System Testing

- This is for IoT based projects
- Optional for projects that do not have IoT

System Testing was carried out to compare the actual developed system with the objectives of the project. These two will be evaluated side by side to determine if the System meets its requirements.

**Table 6.7: System Testing**

|    | System Requirement                                                                                                       | Actual Developed Function                                                                                                                                                  |
| -- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. | To create a smart flowerpot that monitors, analyses, and optimises the environmental conditions of plants automatically. | A smart flowerpot that monitors and analyses the plant's conditions. Optimisation of environmental conditions only provided at its most basic level, which is irrigation.  |
| 2. | To be able to control, manage, and generate useful reports from the smart flowerpot through a mobile application developed. | The smart flowerpot can be controlled and managed from Android Application. Use report can also be generated and displayed through selection of criteria.              |
| 3. | To analyze data derived from the system and build data models that will optimally improve the plant's condition.         | Data collected from the smart flowerpot was analysed. The system is able to generate classification of a plant's condition and suggests ways in which its condition can be improved. |

---

## 6.4 Usability Testing

Usability tests are carried out to test whether the system was developed in a usable fashion for its end-users. Refer back to your chapter 3 on user requirements.

**Table 6.8: Usability Tests**

| Date/Time                          | Task                                            | Subject       | Time | Observation                                                                                                                  | Status            | Conclusion                                                                                                                                                                              |
| ---------------------------------- | ----------------------------------------------- | ------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Subject 1**                      |                                                 |               |      |                                                                                                                              |                   |                                                                                                                                                                                         |
| 12/11/2023 (Sunday) (4.00 p.m.)    | Find sensor details and health data from application | Joshua Balang | 2s   | The subject was able to locate and identify sensor details successfully with no supervision                                  | Success           | Location of sensor and plant health details is easy to discover.                                                                                                                        |
|                                    | Reset health appearance index of plant          |               | 12s  | The subject found it difficult to locate the feature to set the health appearance index of plant but finally could after try and errors. | Moderate Success  | The location of the health appearance index is not apparently visible as it requires users to click on the plant itself. A tooltip could be added for ease of identification.            |
|                                    | Locate Menu                                     |               | 2s   | The subject was able to immediately identify menu                                                                            | Success           | Menu complies to global design and thus easily recognizable                                                                                                                             |
|                                    | Locate Statistics Page                          |               | 5s   | The subject located the statistics page with ease through the menu                                                           | Success           | Statistics page is rightfully names and located                                                                                                                                         |

---

## 6.5 Acceptance Testing

The purpose of acceptance testing is to demonstrate that the completed system meets the predefined requirements and is acceptable to the end user, or client. It serves as the final verification step to ensure the project is ready for deployment or handover.

**Table 6.9: Acceptance Test 1**

| Tester               | Tiffany Tan, Gardener                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test date            | 18-11-2018                                                                                                                                         |
| Prototype developer  | Mr. Lee Eu Vern                                                                                                                                    |
| Test Objective       | Try to record plant health for the day                                                                                                             |
| Potential Test Inputs| 1. Click event<br>2. Slider event<br>3. Button click event                                                                                         |
| Expected Test Outputs| Image of plant in the system changes to represent the selected current health of the physical plant.                                               |
| Test Procedures      | 1. Open the mobile app<br>2. Click Plant Image<br>3. Slide to indicate plant health<br>4. Click "Done" button                                      |
| Actual Test Results  | The system successfully changes the image of the plant to reflect the current health of the physical plant.                                        |
| Comments by User     | The user is satisfied with the system as it produced the desired results. The user commented that the design looks nice, and it is easy to know the current health of the plant at one glance. |

---

## 5.10 Summary

Briefly reiterate the key findings, effectiveness, and outcomes of the testing process. Wrap up the chapter by showing how testing contributed to the system's reliability and readiness.
